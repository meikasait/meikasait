/* =========================================================================
   Meikasait — Autenticazione multi-utente + ruoli + passkey
   - Ogni admin ha username/email, password hash, ruolo e passkey personali
   - Login: password = primo fattore; passkey = secondo fattore se configurata
   - Gli utenti sono salvati in data/admin-users.json (non esposto pubblicamente)
   ========================================================================= */

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");

const ROOT = path.join(__dirname, "..");
const USERS_FILE = path.join(ROOT, "data", "admin-users.json");

const DEFAULT_ADMIN_USER = process.env.ADMIN_USER || "admin";
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const DEFAULT_ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH || "";
const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASS || "meikasait2026";
const LEGACY_ADMIN_PASSKEY = process.env.ADMIN_PASSKEY || "";

const ROLE_LABELS = {
  owner: "Proprietario",
  superadmin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
};
const ROLE_POWER = { owner: 100, superadmin: 90, admin: 50, editor: 20 };

function now() { return new Date().toISOString(); }
function safeId() { return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex"); }
function normalizeLogin(v) { return String(v || "").trim().toLowerCase(); }
function ensureDir() { fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true }); }

function legacyPasskeyToUserFormat() {
  if (!LEGACY_ADMIN_PASSKEY) return [];
  try {
    const json = JSON.parse(Buffer.from(LEGACY_ADMIN_PASSKEY, "base64").toString("utf8"));
    return [{
      id: json.id,
      name: "Passkey importata",
      publicKey: json.publicKey,
      counter: json.counter || 0,
      transports: json.transports || [],
      createdAt: now(),
      lastUsedAt: "",
    }];
  } catch (e) {
    return [];
  }
}

function initialPasswordHash() {
  if (DEFAULT_ADMIN_PASS_HASH) return DEFAULT_ADMIN_PASS_HASH;
  return bcrypt.hashSync(DEFAULT_ADMIN_PASS, 12);
}

function ensureUsersFile() {
  ensureDir();
  if (fs.existsSync(USERS_FILE)) return;
  const firstUser = {
    id: safeId(),
    username: DEFAULT_ADMIN_USER,
    email: DEFAULT_ADMIN_EMAIL,
    role: "owner",
    active: true,
    passwordHash: initialPasswordHash(),
    passkeys: legacyPasskeyToUserFormat(),
    createdAt: now(),
    updatedAt: now(),
    lastLoginAt: "",
  };
  writeStore({ version: 1, users: [firstUser] });
}

function readStore() {
  ensureUsersFile();
  try {
    const store = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    if (!store || !Array.isArray(store.users)) throw new Error("Formato utenti non valido");
    return store;
  } catch (e) {
    throw new Error("Impossibile leggere data/admin-users.json");
  }
}

function writeStore(store) {
  ensureDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(store, null, 2), "utf8");
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email || "",
    role: user.role || "editor",
    roleLabel: ROLE_LABELS[user.role] || user.role,
    active: user.active !== false,
    passkeysCount: Array.isArray(user.passkeys) ? user.passkeys.length : 0,
    passkeys: (user.passkeys || []).map((p) => ({
      id: p.id,
      name: p.name || "Passkey",
      createdAt: p.createdAt || "",
      lastUsedAt: p.lastUsedAt || "",
      transports: p.transports || [],
    })),
    createdAt: user.createdAt || "",
    updatedAt: user.updatedAt || "",
    lastLoginAt: user.lastLoginAt || "",
  };
}

function listUsers() {
  return readStore().users.map(sanitizeUser);
}

function getUserById(id) {
  return readStore().users.find((u) => u.id === id) || null;
}

function findUser(login) {
  const n = normalizeLogin(login);
  if (!n) return null;
  return readStore().users.find((u) =>
    normalizeLogin(u.username) === n || (u.email && normalizeLogin(u.email) === n)
  ) || null;
}

function rolePower(role) { return ROLE_POWER[role] || 0; }
function canManageUsers(user) { return !!user && rolePower(user.role) >= ROLE_POWER.superadmin; }
function canEditContent(user) { return !!user && rolePower(user.role) >= ROLE_POWER.editor; }

function validateRole(role) {
  return ROLE_POWER[role] ? role : "editor";
}

function verifyPasswordForUser(user, plain) {
  if (!user || user.active === false || !user.passwordHash) return false;
  try { return bcrypt.compareSync(String(plain || ""), user.passwordHash); }
  catch (e) { return false; }
}

function hashPassword(password) {
  const p = String(password || "");
  if (p.length < 8) throw new Error("La password deve avere almeno 8 caratteri");
  return bcrypt.hashSync(p, 12);
}

function createUser({ username, email = "", password, role = "editor" }, actor = null) {
  const store = readStore();
  const cleanUsername = String(username || "").trim();
  const cleanEmail = String(email || "").trim();
  const cleanRole = validateRole(role);

  if (!cleanUsername || cleanUsername.length < 3) throw new Error("Username troppo corto");
  if (!password || String(password).length < 8) throw new Error("Password troppo corta");
  if (store.users.some((u) => normalizeLogin(u.username) === normalizeLogin(cleanUsername))) throw new Error("Username già esistente");
  if (cleanEmail && store.users.some((u) => normalizeLogin(u.email) === normalizeLogin(cleanEmail))) throw new Error("Email già esistente");
  if (cleanRole === "owner" && (!actor || actor.role !== "owner")) throw new Error("Solo il proprietario può creare un altro owner");

  const user = {
    id: safeId(),
    username: cleanUsername,
    email: cleanEmail,
    role: cleanRole,
    active: true,
    passwordHash: hashPassword(password),
    passkeys: [],
    createdAt: now(),
    updatedAt: now(),
    lastLoginAt: "",
  };
  store.users.push(user);
  writeStore(store);
  return sanitizeUser(user);
}

function updateUser(id, patch, actor) {
  const store = readStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) throw new Error("Utente non trovato");
  if (user.role === "owner" && actor && actor.id !== user.id && actor.role !== "owner") throw new Error("Non puoi modificare l'owner");

  if (patch.username != null) {
    const username = String(patch.username || "").trim();
    if (username.length < 3) throw new Error("Username troppo corto");
    if (store.users.some((u) => u.id !== id && normalizeLogin(u.username) === normalizeLogin(username))) throw new Error("Username già esistente");
    user.username = username;
  }
  if (patch.email != null) {
    const email = String(patch.email || "").trim();
    if (email && store.users.some((u) => u.id !== id && normalizeLogin(u.email) === normalizeLogin(email))) throw new Error("Email già esistente");
    user.email = email;
  }
  if (patch.role != null) {
    const role = validateRole(patch.role);
    if (role === "owner" && (!actor || actor.role !== "owner")) throw new Error("Solo l'owner può assegnare il ruolo owner");
    if (user.role === "owner" && role !== "owner") {
      const owners = store.users.filter((u) => u.role === "owner" && u.active !== false);
      if (owners.length <= 1) throw new Error("Deve restare almeno un owner attivo");
    }
    user.role = role;
  }
  if (patch.active != null) {
    const next = !!patch.active;
    if (user.role === "owner" && !next) {
      const owners = store.users.filter((u) => u.role === "owner" && u.active !== false);
      if (owners.length <= 1) throw new Error("Non puoi disattivare l'unico owner attivo");
    }
    user.active = next;
  }
  user.updatedAt = now();
  writeStore(store);
  return sanitizeUser(user);
}

function setUserPassword(id, password) {
  const store = readStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) throw new Error("Utente non trovato");
  user.passwordHash = hashPassword(password);
  user.updatedAt = now();
  writeStore(store);
  return sanitizeUser(user);
}

function removePasskey(userId, passkeyId) {
  const store = readStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) throw new Error("Utente non trovato");
  user.passkeys = (user.passkeys || []).filter((p) => p.id !== passkeyId);
  user.updatedAt = now();
  writeStore(store);
  return sanitizeUser(user);
}

function markLogin(userId) {
  const store = readStore();
  const user = store.users.find((u) => u.id === userId);
  if (user) {
    user.lastLoginAt = now();
    user.updatedAt = now();
    writeStore(store);
  }
}

function getRP(req) {
  const host = (req && req.get && req.get("host")) || "localhost:3000";
  const hostname = host.split(":")[0];
  const rpID = process.env.RP_ID || hostname;
  const protocol = (req && req.protocol) || "http";
  const origin = process.env.ORIGIN || `${protocol}://${host}`;
  return { rpID, origin, rpName: "Meikasait Admin" };
}

function toWebAuthnAuthenticator(p) {
  // @simplewebauthn/server v10 usa la chiave "authenticator" con nomi legacy.
  // credentialID deve essere binario; nel nostro JSON è salvato come base64url.
  return {
    credentialID: Buffer.from(p.id, "base64url"),
    credentialPublicKey: Buffer.from(p.publicKey, "base64"),
    counter: p.counter || 0,
    transports: p.transports || [],
  };
}

function toWebAuthnCredential(p) {
  // Compatibilità con versioni più nuove della libreria, se in futuro aggiorniamo.
  return {
    id: p.id,
    publicKey: Buffer.from(p.publicKey, "base64"),
    counter: p.counter || 0,
    transports: p.transports || [],
  };
}

function exportPasskey(cred, name = "Passkey") {
  return {
    id: cred.id,
    name,
    publicKey: Buffer.from(cred.publicKey).toString("base64"),
    counter: cred.counter || 0,
    transports: cred.transports || [],
    createdAt: now(),
    lastUsedAt: "",
  };
}

async function regOptions(req, user) {
  const { rpID, rpName } = getRP(req);
  const existing = (user.passkeys || []);
  return generateRegistrationOptions({
    rpName,
    rpID,
    userID: Buffer.from(user.id),
    userName: user.username,
    userDisplayName: user.email || user.username,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
    excludeCredentials: existing.map((p) => ({ id: p.id, transports: p.transports || [] })),
  });
}

async function regVerify(req, body, expectedChallenge, user, name = "Passkey") {
  const { rpID, origin } = getRP(req);
  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: false,
  });
  if (!verification.verified || !verification.registrationInfo) return { verified: false };

  const info = verification.registrationInfo;
  const cred = info.credential || {};
  const credID = cred.id || info.credentialID;
  const credPubKey = cred.publicKey || info.credentialPublicKey;
  const counter = cred.counter != null ? cred.counter : info.counter;
  const passkey = exportPasskey({
    id: typeof credID === "string" ? credID : Buffer.from(credID).toString("base64url"),
    publicKey: Buffer.from(credPubKey),
    counter: counter || 0,
    transports: (body.response && body.response.transports) || [],
  }, name);

  const store = readStore();
  const u = store.users.find((x) => x.id === user.id);
  if (!u) return { verified: false };
  u.passkeys = u.passkeys || [];
  if (!u.passkeys.some((p) => p.id === passkey.id)) u.passkeys.push(passkey);
  u.updatedAt = now();
  writeStore(store);
  return { verified: true, passkey: sanitizeUser(u).passkeys.find((p) => p.id === passkey.id) };
}

async function authOptions(req, user) {
  const { rpID } = getRP(req);
  const passkeys = user.passkeys || [];
  return generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: passkeys.map((p) => ({ id: p.id, transports: p.transports || [] })),
  });
}

async function authVerify(req, body, expectedChallenge, user) {
  const { rpID, origin } = getRP(req);
  const passkeys = user.passkeys || [];
  const credentialId = body && body.id;
  const stored = passkeys.find((p) => p.id === credentialId);
  if (!stored) return { verified: false };

  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: toWebAuthnAuthenticator(stored),
    // Campo aggiunto per compatibilità con versioni più recenti di SimpleWebAuthn.
    credential: toWebAuthnCredential(stored),
    requireUserVerification: false,
  });

  if (!verification.verified) return { verified: false };

  const store = readStore();
  const u = store.users.find((x) => x.id === user.id);
  if (u) {
    const p = (u.passkeys || []).find((x) => x.id === stored.id);
    if (p) {
      const newCounter = verification.authenticationInfo && verification.authenticationInfo.newCounter;
      if (newCounter != null) p.counter = newCounter;
      p.lastUsedAt = now();
    }
    u.updatedAt = now();
    writeStore(store);
  }
  return { verified: true };
}

ensureUsersFile();

module.exports = {
  ROLE_LABELS,
  ROLE_POWER,
  DEFAULT_ADMIN_USER,
  usingDefaultPassword: () => !DEFAULT_ADMIN_PASS_HASH && (!process.env.ADMIN_PASS || process.env.ADMIN_PASS === "meikasait2026"),
  listUsers,
  getUserById,
  findUser,
  sanitizeUser,
  createUser,
  updateUser,
  setUserPassword,
  removePasskey,
  markLogin,
  verifyPasswordForUser,
  canManageUsers,
  canEditContent,
  rolePower,
  getRP,
  regOptions,
  regVerify,
  authOptions,
  authVerify,
};
