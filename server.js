/* =========================================================================
   Meikasait — Server Express (versione hardened / sicurezza)
   - Serve il sito statico (index.html, assets, privacy.html)
   - Espone SOLO data/content.json (non i backup)
   - Pannello admin protetto (/admin) con login utente+password
   - API per leggere/salvare la configurazione e caricare immagini
   - Route SPA-friendly per le schede lavoro: /lavoro/:slug
   - sitemap.xml e robots.txt generati dinamicamente

   Misure di sicurezza implementate:
   - helmet (security headers, CSP, HSTS, niente X-Powered-By)
   - rate limiting su login e API
   - password con hash bcrypt (ADMIN_PASS_HASH) o fallback in chiaro
   - cookie di sessione httpOnly + secure (in produzione) + sameSite
   - protezione CSRF (controllo Origin/Referer + header same-site)
   - blocco accesso a file sorgente, dotfile, backup
   - validazione/sanitizzazione upload e config
   ========================================================================= */

const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const auth = require("./lib/auth");

const app = express();
const PORT = process.env.PORT || 4000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "content.json");
const UPLOADS_DIR = path.join(ROOT, "public", "uploads");
const IS_PROD = process.env.NODE_ENV === "production" || !!process.env.RENDER;
const DEBUG_AUTH = process.env.DEBUG_AUTH === "1" || process.env.DEBUG_AUTH === "true";

app.set("trust proxy", 1); // necessario dietro il proxy di Render per cookie secure & rate-limit

/* --- Credenziali / 2FA gestiti in lib/auth.js --- */
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

// Avvisi di sicurezza all'avvio (senza stampare segreti)
const warnings = [];
if (auth.usingDefaultPassword()) {
  warnings.push("Password admin di DEFAULT in uso: imposta ADMIN_PASS_HASH (consigliato) o ADMIN_PASS.");
}
if (!process.env.SESSION_SECRET) {
  warnings.push("SESSION_SECRET non impostato: ne uso uno casuale (le sessioni si invalidano ad ogni riavvio).");
}
warnings.push("Sistema multi-utente attivo: crea utenti separati e registra una passkey per ogni admin.");
function authDebug(label, data = {}) {
  const safe = { ...data };
  if (safe.error && safe.error.stack) safe.error = safe.error.stack;
  if (safe.error && safe.error.message) safe.error = safe.error.message;
  const line = `[${new Date().toISOString()}] ${label} ${JSON.stringify(safe, null, 0)}\n`;
  try {
    fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });
    fs.appendFileSync(path.join(ROOT, "data", "auth-debug.log"), line, "utf8");
  } catch (e) {}
  if (DEBUG_AUTH) console.log(`[AUTH DEBUG] ${label}`, safe);
}


/* --- Assicura le cartelle --- */
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

/* =========================== Security headers =========================== */
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      // Inline script presenti in privacy.html: consentiti solo da self + inline minimo
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "blob:"],
      "connect-src": ["'self'"],
      "frame-ancestors": ["'none'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "upgrade-insecure-requests": []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: IS_PROD ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
}));
app.use(helmet.referrerPolicy({ policy: "same-origin" }));

/* =========================== Middleware base =========================== */
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(session({
  name: "meikasait.sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: IS_PROD,           // cookie inviato solo su HTTPS in produzione
    sameSite: "strict",        // mitiga CSRF
    maxAge: 1000 * 60 * 60 * 4 // 4 ore
  }
}));

/* =========================== Rate limiting =========================== */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minuti
  max: 10,                     // max 10 tentativi di login per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppi tentativi di accesso. Riprova tra qualche minuto." }
});
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 200,                    // limite generoso per le API normali
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api/", apiLimiter);

/* =========================== CSRF (difesa same-origin) =========================== */
/* Per le richieste che modificano stato, verifichiamo che l'Origin/Referer
   coincida con l'host del sito. Combinato con SameSite=strict, blocca CSRF. */
function sameOriginGuard(req, res, next) {
  const origin = req.get("origin");
  const referer = req.get("referer");
  const host = req.get("host");
  const ok = (val) => {
    if (!val) return false;
    try { return new URL(val).host === host; } catch (e) { return false; }
  };
  // Se non c'è né origin né referer (es. tool non-browser), neghiamo le mutazioni
  if (ok(origin) || ok(referer)) return next();
  return res.status(403).json({ error: "Richiesta cross-origin non consentita" });
}

/* --- Upload immagini (sicuro) --- */
const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    const rand = crypto.randomBytes(4).toString("hex");
    cb(null, `${Date.now()}-${rand}-${base || "img"}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = /^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype);
    // niente SVG: può contenere JavaScript (XSS). Solo immagini raster.
    if (mimeOk && ALLOWED_EXT.has(ext)) cb(null, true);
    else cb(new Error("Solo immagini PNG, JPG, GIF o WEBP sono ammesse"));
  }
});

/* --- Helper config --- */
function readConfig() { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
function writeConfig(cfg) { fs.writeFileSync(DATA_FILE, JSON.stringify(cfg, null, 2), "utf8"); }

/* --- Auth guard: sessione PIENA (password + eventuale passkey superati) --- */
function attachUser(req, res, next) {
  const userId = req.session && req.session.userId;
  const user = userId ? auth.getUserById(userId) : null;
  if (user && user.active !== false) req.adminUser = user;
  next();
}
app.use(attachUser);

function requireAuth(req, res, next) {
  if (req.session && req.session.authed && req.adminUser) return next();
  if (req.path.startsWith("/api/")) return res.status(401).json({ error: "Non autenticato" });
  return res.redirect("/admin/login");
}

function requireHalf(req, res, next) {
  const userId = req.session && req.session.halfUserId;
  const user = userId ? auth.getUserById(userId) : null;
  if (req.session && req.session.halfAuth && user && user.active !== false) {
    req.halfUser = user;
    return next();
  }
  return res.status(401).json({ error: "Sessione non valida, rifai il login" });
}

function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.adminUser) return res.status(401).json({ error: "Non autenticato" });
    if (auth.rolePower(req.adminUser.role) < auth.rolePower(minRole)) {
      return res.status(403).json({ error: "Permessi insufficienti" });
    }
    next();
  };
}

function completeLogin(req, user) {
  req.session.authed = true;
  req.session.userId = user.id;
  req.session.user = user.username;
  delete req.session.halfAuth;
  delete req.session.halfUserId;
  auth.markLogin(user.id);
}
/* =========================== CONTACT FORM (SMTP) =========================== */
const nodemailer = require("nodemailer");

const smtpConfig = {
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
};

const mailTransporter = (smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass)
  ? nodemailer.createTransport({
      ...smtpConfig,
      connectionTimeout: 30000,   // 30 sec per la connessione iniziale
      greetingTimeout: 30000,
      socketTimeout: 30000,
      pool: true,                 // riusa connessioni (più veloce)
      maxConnections: 3,
      maxMessages: 100,
      logger: false,
    })
  : null;

// Helper: invia con retry automatico (3 tentativi)
async function sendMailWithRetry(mailOptions, maxAttempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const info = await mailTransporter.sendMail(mailOptions);
      if (attempt > 1) console.log("[contact] Email inviata al tentativo " + attempt);
      return info;
    } catch (err) {
      lastError = err;
      console.warn("[contact] Tentativo " + attempt + "/" + maxAttempts + " fallito:", err.code || err.message);
      if (attempt < maxAttempts) {
        // Aspetta 2 sec prima di riprovare
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  throw lastError;
}

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppe richieste. Riprova tra qualche minuto." },
});

app.post("/api/contact", contactLimiter, sameOriginGuard, async (req, res) => {
  try {
    const { name, email, packageName, message, consent, website } = req.body || {};

    if (website && website.trim()) {
      return res.json({ ok: true });
    }

    if (!consent) return res.status(400).json({ error: "Devi accettare la Privacy Policy per inviare la richiesta." });
    if (!name || name.trim().length < 2) return res.status(400).json({ error: "Nome mancante o troppo corto." });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Email non valida." });
    if (!message || message.trim().length < 10) return res.status(400).json({ error: "Messaggio troppo corto (minimo 10 caratteri)." });

    if (!mailTransporter) {
      return res.status(503).json({
        error: "Servizio email temporaneamente non disponibile. Scrivici direttamente a " + (process.env.MAIL_TO || "wimeikasait@gmail.com")
      });
    }

    const escHtml = (s) => String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });

    const dataStr = new Date().toLocaleString("it-IT");
    const subject = "[Meikasa.it] Nuova richiesta da " + name + (packageName ? " - " + packageName : "");

    const textBody =
      "Nuova richiesta dal sito Meikasa.it\n" +
      "\n" +
      "Nome: " + name + "\n" +
      "Email: " + email + "\n" +
      "Pacchetto/servizio: " + (packageName || "-") + "\n" +
      "\n" +
      "Messaggio:\n" +
      message + "\n" +
      "\n" +
      "---\n" +
      "Consenso privacy: accettato il " + dataStr + "\n" +
      "IP: " + req.ip + "\n" +
      "User-Agent: " + (req.get("user-agent") || "n/d") + "\n";

    const htmlBody =
      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:1.5rem;background:#f6f1e6;color:#13201c">' +
        '<h2 style="color:#c0392b;margin:0 0 1rem">Nuova richiesta da Meikasa.it</h2>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:1rem">' +
          '<tr><td style="padding:.5rem;background:#fffdf6;font-weight:bold;width:130px">Nome</td>' +
              '<td style="padding:.5rem;background:#fffdf6">' + escHtml(name) + '</td></tr>' +
          '<tr><td style="padding:.5rem;background:#fffdf6;font-weight:bold">Email</td>' +
              '<td style="padding:.5rem;background:#fffdf6"><a href="mailto:' + escHtml(email) + '">' + escHtml(email) + '</a></td></tr>' +
          '<tr><td style="padding:.5rem;background:#fffdf6;font-weight:bold">Pacchetto</td>' +
              '<td style="padding:.5rem;background:#fffdf6">' + escHtml(packageName || "-") + '</td></tr>' +
        '</table>' +
        '<h3 style="margin:1rem 0 .3rem">Messaggio</h3>' +
        '<div style="padding:1rem;background:#fffdf6;border-left:4px solid #c0392b;white-space:pre-wrap">' + escHtml(message) + '</div>' +
        '<p style="margin-top:1.5rem;font-size:.8rem;color:#5e6a64">' +
          'Consenso privacy accettato il ' + dataStr + '<br>' +
          'IP: ' + escHtml(req.ip) +
        '</p>' +
      '</div>';

    const mailOptions = {
      from: process.env.MAIL_FROM || smtpConfig.auth.user,
      to: process.env.MAIL_TO || smtpConfig.auth.user,
      replyTo: name + " <" + email + ">",
      subject: subject,
      text: textBody,
      html: htmlBody,
    };

    // Rispondi SUBITO all'utente (miglior UX)
    res.json({ ok: true });

    // Invia in background con retry (non blocca la risposta HTTP)
    sendMailWithRetry(mailOptions).then(
      () => console.log("[contact] Email inviata da " + email + " (" + name + ")"),
      (err) => console.error("[contact] Errore invio email definitivo dopo retry:", err.message)
    );
    return;

    console.log("[contact] Email inviata da " + email + " (" + name + ")");
    res.json({ ok: true });
  } catch (err) {
    console.error("[contact] Errore invio email:", err);
    res.status(500).json({ error: "Errore durante l'invio. Riprova o scrivici direttamente." });
  }
});
/* =========================== AUTENTICAZIONE =========================== */

/* STEP 1 — password. Se l'utente ha almeno una passkey, NON autentica ancora:
   crea uno stato "halfAuth" e richiede la passkey come secondo fattore. */
app.post("/api/login", loginLimiter, sameOriginGuard, (req, res) => {
  const { user, pass } = req.body || {};
  const found = auth.findUser(user);
  const ok = found && auth.verifyPasswordForUser(found, pass || "");
  authDebug("login-password", { login: user, found: !!found, active: found ? found.active !== false : null, passkeys: found && found.passkeys ? found.passkeys.length : 0, ok: !!ok });
  if (!ok) return res.status(401).json({ error: "Credenziali non valide" });

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "Errore di sessione" });
    const hasPasskey = Array.isArray(found.passkeys) && found.passkeys.length > 0;
    if (hasPasskey) {
      req.session.halfAuth = true;
      req.session.halfUserId = found.id;
      return res.json({ ok: true, twoFactor: true, methods: { passkey: true, email: false } });
    }
    // Nessuna passkey configurata per questo account: accesso diretto.
    // L'admin potrà poi aumentare il livello di sicurezza registrando una passkey.
    completeLogin(req, found);
    res.json({ ok: true, twoFactor: false, needsPasskeySetup: true });
  });
});

/* STEP 2 — passkey: opzioni di autenticazione */
app.get("/api/2fa/passkey/options", requireHalf, async (req, res) => {
  try {
    const options = await auth.authOptions(req, req.halfUser);
    req.session.authChallenge = options.challenge;
    authDebug("passkey-options", { user: req.halfUser.username, rp: auth.getRP(req), allowCredentials: options.allowCredentials ? options.allowCredentials.length : 0 });
    res.json(options);
  } catch (e) { authDebug("passkey-options-error", { error: e }); res.status(500).json({ error: "Errore generazione opzioni passkey" }); }
});

/* STEP 2 — passkey: verifica */
app.post("/api/2fa/passkey/verify", loginLimiter, sameOriginGuard, requireHalf, async (req, res) => {
  try {
    const challenge = req.session.authChallenge;
    if (!challenge) return res.status(400).json({ error: "Sessione scaduta, riprova" });
    authDebug("passkey-verify-start", { user: req.halfUser.username, credentialId: req.body && req.body.id, rp: auth.getRP(req), hasChallenge: !!challenge });
    const result = await auth.authVerify(req, req.body, challenge, req.halfUser);
    delete req.session.authChallenge;
    authDebug("passkey-verify-result", { user: req.halfUser.username, verified: !!result.verified });
    if (!result.verified) return res.status(401).json({ error: "Passkey non verificata" });
    completeLogin(req, req.halfUser);
    res.json({ ok: true });
  } catch (e) {
    authDebug("passkey-verify-error", { error: e, message: e && e.message, rp: auth.getRP(req) });
    res.status(500).json({ error: "Errore verifica passkey", detail: DEBUG_AUTH || !IS_PROD ? (e && e.message) : undefined });
  }
});

/* Compatibilità: TOTP disattivato nella nuova gestione multi-utente */
app.post("/api/2fa/totp", loginLimiter, sameOriginGuard, requireHalf, (req, res) => {
  res.status(400).json({ error: "TOTP non configurato. Usa la passkey." });
});

/* =========================== REGISTRAZIONE PASSKEY =========================== */
app.get("/api/passkey/register/options", requireAuth, async (req, res) => {
  try {
    const targetUserId = req.query.userId || req.adminUser.id;
    if (targetUserId !== req.adminUser.id && !auth.canManageUsers(req.adminUser)) {
      return res.status(403).json({ error: "Permessi insufficienti" });
    }
    const targetUser = auth.getUserById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: "Utente non trovato" });
    const options = await auth.regOptions(req, targetUser);
    req.session.regChallenge = options.challenge;
    req.session.regUserId = targetUser.id;
    authDebug("passkey-register-options", { targetUser: targetUser.username, rp: auth.getRP(req), excludeCredentials: options.excludeCredentials ? options.excludeCredentials.length : 0 });
    res.json(options);
  } catch (e) { authDebug("passkey-register-options-error", { error: e }); res.status(500).json({ error: "Errore generazione opzioni" }); }
});

app.post("/api/passkey/register/verify", requireAuth, sameOriginGuard, async (req, res) => {
  try {
    const challenge = req.session.regChallenge;
    const userId = req.session.regUserId || req.adminUser.id;
    const targetUser = auth.getUserById(userId);
    if (!challenge || !targetUser) return res.status(400).json({ error: "Sessione scaduta, riprova" });
    if (targetUser.id !== req.adminUser.id && !auth.canManageUsers(req.adminUser)) {
      return res.status(403).json({ error: "Permessi insufficienti" });
    }
    authDebug("passkey-register-verify-start", { targetUser: targetUser.username, credentialId: req.body && req.body.id, rp: auth.getRP(req), hasChallenge: !!challenge });
    const result = await auth.regVerify(req, req.body, challenge, targetUser, req.body.passkeyName || "Passkey");
    delete req.session.regChallenge;
    delete req.session.regUserId;
    authDebug("passkey-register-verify-result", { targetUser: targetUser.username, verified: !!result.verified });
    if (!result.verified) return res.status(400).json({ error: "Registrazione non riuscita" });
    res.json({ ok: true, passkey: result.passkey });
  } catch (e) {
    authDebug("passkey-register-verify-error", { error: e, message: e && e.message, rp: auth.getRP(req) });
    res.status(500).json({ error: "Errore registrazione passkey", detail: DEBUG_AUTH || !IS_PROD ? (e && e.message) : undefined });
  }
});

/* Stato auth per la UI */
// Endpoint diagnostico: verifica che l'utente admin esista (senza rivelare password)
app.get("/api/auth/health", (req, res) => {
  try {
    const users = auth.listUsers();
    res.json({
      ok: true,
      users_count: users.length,
      has_owner: users.some(u => u.role === "owner" && u.active !== false),
      env_default_pass_hash: !!process.env.ADMIN_PASS_HASH,
      env_default_pass: !!process.env.ADMIN_PASS,
      is_prod: IS_PROD,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/auth/status", (req, res) => {
  const user = req.adminUser ? auth.sanitizeUser(req.adminUser) : null;
  res.json({
    authed: !!(req.session && req.session.authed && req.adminUser),
    user,
    twoFactor: !!(user && user.passkeysCount > 0),
    methods: { passkey: !!(user && user.passkeysCount > 0), email: false }
  });
});

app.post("/api/logout", sameOriginGuard, (req, res) => {
  req.session.destroy(() => { res.clearCookie("meikasait.sid"); res.json({ ok: true }); });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: auth.sanitizeUser(req.adminUser) });
});

app.get("/api/auth/debug-log", requireAuth, requireRole("superadmin"), (req, res) => {
  const file = path.join(ROOT, "data", "auth-debug.log");
  if (!fs.existsSync(file)) return res.type("text/plain").send("Nessun log auth presente.");
  res.type("text/plain").send(fs.readFileSync(file, "utf8").slice(-20000));
});

app.post("/api/me/password", requireAuth, sameOriginGuard, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!auth.verifyPasswordForUser(req.adminUser, currentPassword || "")) {
      return res.status(401).json({ error: "Password attuale non valida" });
    }
    const user = auth.setUserPassword(req.adminUser.id, newPassword);
    res.json({ ok: true, user });
  } catch (e) { res.status(400).json({ error: e.message || "Errore cambio password" }); }
});

app.get("/api/users", requireAuth, requireRole("superadmin"), (req, res) => {
  res.json({ users: auth.listUsers(), roles: auth.ROLE_LABELS });
});

app.post("/api/users", requireAuth, requireRole("superadmin"), sameOriginGuard, (req, res) => {
  try {
    const user = auth.createUser(req.body || {}, req.adminUser);
    res.json({ ok: true, user });
  } catch (e) { res.status(400).json({ error: e.message || "Errore creazione utente" }); }
});

app.patch("/api/users/:id", requireAuth, requireRole("superadmin"), sameOriginGuard, (req, res) => {
  try {
    const user = auth.updateUser(req.params.id, req.body || {}, req.adminUser);
    res.json({ ok: true, user });
  } catch (e) { res.status(400).json({ error: e.message || "Errore aggiornamento utente" }); }
});

app.post("/api/users/:id/password", requireAuth, requireRole("superadmin"), sameOriginGuard, (req, res) => {
  try {
    const user = auth.setUserPassword(req.params.id, req.body && req.body.password);
    res.json({ ok: true, user });
  } catch (e) { res.status(400).json({ error: e.message || "Errore password" }); }
});

app.delete("/api/users/:id/passkeys/:passkeyId", requireAuth, sameOriginGuard, (req, res) => {
  try {
    if (req.params.id !== req.adminUser.id && !auth.canManageUsers(req.adminUser)) {
      return res.status(403).json({ error: "Permessi insufficienti" });
    }
    const user = auth.removePasskey(req.params.id, req.params.passkeyId);
    res.json({ ok: true, user });
  } catch (e) { res.status(400).json({ error: e.message || "Errore rimozione passkey" }); }
});

app.get("/api/config", requireAuth, requireRole("editor"), (req, res) => {
  try { res.json(readConfig()); }
  catch (e) { res.status(500).json({ error: "Impossibile leggere la configurazione" }); }
});

app.post("/api/config", requireAuth, requireRole("editor"), sameOriginGuard, (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ error: "Dati non validi" });
    }
    // backup (in cartella protetta, NON servita pubblicamente)
    try { fs.copyFileSync(DATA_FILE, DATA_FILE + ".bak"); } catch (e) {}
    writeConfig(body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Errore nel salvataggio" });
  }
});

app.post("/api/upload", requireAuth, requireRole("editor"), sameOriginGuard, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || "Upload non valido" });
    if (!req.file) return res.status(400).json({ error: "Nessun file" });
    res.json({ ok: true, url: "/uploads/" + req.file.filename });
  });
});

/* =========================== Pagine admin =========================== */
// File statici del pannello (CSS/JS): non contengono dati sensibili.
app.get("/admin/admin.css", (req, res) => res.sendFile(path.join(ROOT, "admin", "admin.css")));
app.get("/admin/admin.js", (req, res) => res.sendFile(path.join(ROOT, "admin", "admin.js")));
app.get("/admin/login", (req, res) => res.sendFile(path.join(ROOT, "admin", "login.html")));
app.get(["/admin", "/admin/"], requireAuth, (req, res) => res.sendFile(path.join(ROOT, "admin", "index.html")));

/* =========================== Static (whitelist) =========================== */
const staticOpts = {
  dotfiles: "deny",            // blocca .env, .gitignore, .git, ecc.
  index: false,
  setHeaders: (res) => { res.setHeader("X-Content-Type-Options", "nosniff"); }
};

// Uploads pubblici (immagini): forziamo download/no-execution
app.use("/uploads", express.static(UPLOADS_DIR, {
  ...staticOpts,
  setHeaders: (res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'");
  }
}));

// Espone SOLO content.json (non i .bak), come endpoint dedicato
app.get("/data/content.json", (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.sendFile(DATA_FILE);
});

// Assets del sito
app.use("/assets", express.static(path.join(ROOT, "assets"), staticOpts));

/* Whitelist esplicita delle pagine pubbliche: evitiamo express.static(ROOT)
   che esporrebbe server.js, package.json, README, ecc. */
const PUBLIC_PAGES = {
  "/": "index.html",
  "/index.html": "index.html",
  "/privacy.html": "privacy.html",
  "/privacy": "privacy.html"
};
app.get(Object.keys(PUBLIC_PAGES), (req, res) => {
  res.sendFile(path.join(ROOT, PUBLIC_PAGES[req.path] || "index.html"));
});

/* === Schede dettaglio lavori (SPA): /lavoro/:slug ===
   Per SEO basta inviare index.html — il front-end renderizza la scheda
   leggendo slug dall'URL e cercandolo in content.json. */
app.get(/^\/lavoro\/[A-Za-z0-9\-]+\/?$/, (req, res) => {
  res.sendFile(path.join(ROOT, "index.html"));
});

/* === robots.txt ===
   Indicizzabile, escludiamo solo admin e API. */
app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(
`User-agent: *
Disallow: /admin
Disallow: /api/
Allow: /

Sitemap: ${req.protocol}://${req.get("host")}/sitemap.xml
`);
});

/* === sitemap.xml dinamica con i lavori ===
   Generata leggendo content.json: include home, privacy e tutte le schede /lavoro/:slug. */
app.get("/sitemap.xml", (req, res) => {
  let cfg = {};
  try { cfg = readConfig(); } catch (e) {}
  const base = `${req.protocol}://${req.get("host")}`;
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: base + "/", priority: "1.0", changefreq: "weekly" },
    { loc: base + "/privacy.html", priority: "0.4", changefreq: "yearly" },
  ];
  const items = (cfg.works && cfg.works.items) || [];
  items.forEach((w) => {
    const slug = w.slug || String(w.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (slug) urls.push({ loc: `${base}/lavoro/${slug}`, priority: "0.7", changefreq: "monthly" });
  });
  res.type("application/xml").send(
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`);
});

/* === security.txt minimale (RFC 9116) === */
app.get(["/.well-known/security.txt", "/security.txt"], (req, res) => {
  let cfg = {};
  try { cfg = readConfig(); } catch (e) {}
  const email = (cfg.brand && cfg.brand.email) || "ciao@meikasait.it";
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  res.type("text/plain").send(
`Contact: mailto:${email}
Expires: ${expires}
Preferred-Languages: it, en
`);
});

// Fallback: tutto il resto -> 404 (niente leak di file sorgente)
app.use((req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/admin")) {
    return res.status(404).json({ error: "Non trovato" });
  }
  res.status(404).sendFile(path.join(ROOT, "index.html"));
});

app.listen(PORT, () => {
  console.log("=================================================");
  console.log(`  Meikasait online su http://localhost:${PORT}`);
  console.log(`  Pannello admin: http://localhost:${PORT}/admin`);
  console.log(`  Utenti admin configurati: ${auth.listUsers().length}`);
  console.log(`  Modalità: ${IS_PROD ? "PRODUZIONE (cookie secure, HSTS)" : "sviluppo"}`);
  const securedUsers = auth.listUsers().filter((u) => u.passkeysCount > 0).length;
  console.log(`  Account con passkey: ${securedUsers}/${auth.listUsers().length}`);
  if (auth.usingDefaultPassword() && !IS_PROD) {
    console.log("  -------------------------------------------------");
    console.log("  🔑 CREDENZIALI ADMIN DI DEFAULT (solo sviluppo):");
    console.log(`     Username: admin`);
    console.log(`     Password: meikasait2026`);
    console.log("     👉 Cambia password subito dopo il primo accesso.");
  }
  if (DEBUG_AUTH) console.log("  DEBUG_AUTH attivo: verranno stampati dettagli diagnostici login/passkey.");
  if (warnings.length) {
    console.log("  -------------------------------------------------");
    console.log("  ⚠️  AVVISI DI SICUREZZA:");
    warnings.forEach((w) => console.log("    • " + w));
  }
  console.log("=================================================");
});
