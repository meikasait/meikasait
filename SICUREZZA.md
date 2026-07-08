# 🔒 Sicurezza — Meikasait

Questo documento riassume l'audit di sicurezza svolto sul sito e le contromisure
implementate (versione 2.1.0 "hardened").

---

## ✅ Cosa è stato corretto

| # | Vulnerabilità trovata | Gravità | Correzione |
|---|------------------------|---------|------------|
| 1 | Credenziali admin di default (`admin`/`meikasait2026`) | 🔴 Critica | Supporto password con **hash bcrypt** (`ADMIN_PASS_HASH`) + avviso all'avvio se si usano i default |
| 2 | Codice sorgente scaricabile (`/server.js`, `/package.json`, `/.env`…) | 🔴 Critica | **Whitelist** delle pagine pubbliche: tutto il resto → 404. `dotfiles: deny` |
| 3 | Backup config pubblico (`/data/content.json.bak`) | 🟠 Alta | Solo `content.json` è esposto; i `.bak` non sono più serviti |
| 4 | Nessun limite ai tentativi di login (brute force) | 🟠 Alta | **Rate limiting**: max 10 login / 15 min per IP; 200 richieste API / 5 min |
| 5 | Password in chiaro / loggata | 🟠 Alta | Hash bcrypt, confronto a tempo costante, niente password nei log |
| 6 | Nessun security header | 🟡 Media | **Helmet**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| 7 | `X-Powered-By: Express` (fingerprinting) | 🟡 Media | Header rimosso |
| 8 | Cookie di sessione senza `Secure` | 🟡 Media | Cookie `httpOnly` + `Secure` (in produzione) + `SameSite=strict` |
| 9 | Nessuna protezione CSRF | 🟡 Media | Controllo **same-origin** (Origin/Referer) sulle API mutanti + SameSite strict |
| 10 | Upload: solo controllo MIME (falsificabile), SVG ammesso (XSS) | 🟡 Media | Controllo **estensione + MIME**, niente SVG, nomi file randomizzati, CSP sugli upload |
| 11 | Session fixation | 🟡 Media | `session.regenerate()` al login |

Inoltre il front-end **già faceva escaping HTML** dei contenuti (anti-XSS) e l'URL del
Google Font è ora limitato a `https://fonts.googleapis.com`.

---

## 🔑 AZIONE RICHIESTA: imposta una password sicura

Le credenziali di default vanno cambiate **subito** in produzione.

### 1. Genera l'hash della tua password (sul tuo PC)
```bash
npm install
node tools/hash-password.js "LaTuaPasswordRobusta123!"
```
Otterrai una riga tipo:
```
ADMIN_PASS_HASH=$2a$12$abcdefg...
```

### 2. Imposta le variabili d'ambiente su Render
Render → tuo servizio → **Environment** → **Add Environment Variable**:

| Key | Value |
|-----|-------|
| `ADMIN_USER` | il tuo utente (es. `titolare`) |
| `ADMIN_PASS_HASH` | l'hash generato al passo 1 |
| `SESSION_SECRET` | una frase lunga e casuale (32+ caratteri) |
| `NODE_ENV` | `production` |

> ⚠️ Se imposti `ADMIN_PASS_HASH`, **non** serve `ADMIN_PASS` (rimuovila).
> `NODE_ENV=production` attiva cookie `Secure` e HSTS.

### 3. Salva → Render fa il deploy automatico
Da quel momento entri in `/admin` con le tue credenziali; quelle di default non funzionano più.

---

## 🧪 Come ho verificato (riproducibile)

Test eseguiti prima e dopo l'hardening:
- Esposizione file sorgente → ora **404**
- Login con default → ora **401**
- Brute force → ora **429** dopo i tentativi
- CSRF da origin esterno → ora **403**
- Security headers → ora **presenti** (CSP, HSTS, ecc.)

---

## 🔐 Autenticazione a due fattori (2FA) — passkey + TOTP

Il pannello admin ora supporta **due secondi fattori**:

- **Passkey (impronta digitale / Face ID / PIN del dispositivo)** via WebAuthn
- **Codice TOTP a 6 cifre** (Google Authenticator / Authy / 1Password)

Il login diventa: **1) utente + password → 2) impronta OPPURE codice**.

### A) Attivare il codice TOTP (consigliato come base/backup)
1. Sul tuo PC:
   ```bash
   npm install
   node tools/setup-totp.js
   ```
2. Scansiona il QR code mostrato con l'app authenticator (o inserisci il segreto a mano).
3. Copia `ADMIN_TOTP_SECRET=...` nelle **Environment Variables** di Render → salva (deploy).
4. Da ora il login chiede il codice a 6 cifre.

> 💡 Conserva il segreto TOTP in un posto sicuro: è il tuo **accesso di emergenza** se perdi il dispositivo con la passkey.

### B) Aggiungere la passkey (impronta / Face ID)
1. Accedi al pannello (con password + TOTP).
2. Vai nella scheda **🛡️ Sicurezza** → **Registra questo dispositivo**.
3. Conferma con impronta / Face ID / PIN.
4. Copia il valore `ADMIN_PASSKEY=...` generato e incollalo nelle Environment Variables di Render → salva (deploy).
5. Da ora puoi accedere con **🔐 Usa impronta / Face ID**.

> ⚠️ La passkey è legata al dispositivo con cui la registri. Se cambi telefono/PC, usa il **TOTP** per entrare e poi registra una nuova passkey. Per questo è importante avere ENTRAMBI attivi.

### Variabili 2FA su Render — riepilogo
| Key | Cosa | Come ottenerla |
|-----|------|----------------|
| `ADMIN_TOTP_SECRET` | segreto del codice 6 cifre | `node tools/setup-totp.js` |
| `ADMIN_PASSKEY` | la tua passkey registrata | scheda Sicurezza del pannello |
| `RP_ID` | dominio (es. `meikasait2026-1.onrender.com`) | il tuo dominio Render, senza https:// |
| `ORIGIN` | URL completo (es. `https://meikasait2026-1.onrender.com`) | il tuo indirizzo Render |

> Per la **passkey in produzione** imposta anche `RP_ID` e `ORIGIN` col tuo dominio Render, altrimenti WebAuthn rifiuta l'autenticazione (controllo di sicurezza sul dominio).

---

## 📌 Note e limiti residui (onesti)

- **Piano gratuito Render:** il disco non è permanente, quindi `content.json.bak` e gli upload
  possono azzerarsi ad ogni deploy. Non è un problema di sicurezza, ma di persistenza.
- **`'unsafe-inline'` negli script:** necessario perché `privacy.html` usa un piccolo script inline.
  È un compromesso comune; se vuoi una CSP più stretta, si può spostare quello script in un file `.js`
  esterno e rimuovere `'unsafe-inline'`. Posso farlo su richiesta.
- **Un solo utente admin:** è adatto a un sito vetrina. Per più utenti servirebbe un sistema di account.
- **2FA:** non incluso. Se vuoi, si può aggiungere un secondo fattore (TOTP) all'accesso admin.
