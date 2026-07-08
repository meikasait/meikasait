# 🌐 Pubblicare Meikasait su Render con dominio Aruba (meikasa.it)

Guida passo-passo per: **1)** mettere il sito su GitHub, **2)** deploy su Render, **3)** collegare il dominio Aruba `meikasa.it`. Tempo totale: **30–60 minuti** (di cui buona parte è attesa DNS).

---

## 📋 Prerequisiti

- Account [GitHub](https://github.com) (gratuito)
- Account [Render](https://dashboard.render.com) (gratuito, basta collegare GitHub)
- Il tuo dominio `meikasa.it` acquistato su Aruba con accesso al **Pannello di controllo Aruba**
- Git installato sul PC ([download qui](https://git-scm.com/downloads))
- Node.js 20+ ([download qui](https://nodejs.org))
- Lo zip di `meikasait` estratto sul PC

---

## PARTE 1 — Push su GitHub (5 min)

### 1.1 Prepara la repo
Apri terminale nella cartella del progetto (`meikasait/`) e digita:

```bash
git init
git add .
git commit -m "Meikasait v3.2 — pronta al deploy"
git branch -M main
```

### 1.2 Crea la repo su GitHub
1. Vai su https://github.com/new
2. **Repository name**: `meikasait` (o come preferisci)
3. Lascia **Private** (consigliato) o Public
4. **NON** aggiungere README, .gitignore, license (li hai già)
5. Click **Create repository**

### 1.3 Collega e pusha
GitHub ti mostrerà i comandi. Incolla nel terminale (sostituendo `TUO-USERNAME`):

```bash
git remote add origin https://github.com/TUO-USERNAME/meikasait.git
git push -u origin main
```

Ti chiederà username e password. Al posto della password devi usare un **Personal Access Token** (PAT):
- Vai su https://github.com/settings/tokens → **Generate new token (classic)**
- Scope: spunta **`repo`**
- Genera, copia il token, e usalo come password

---

## PARTE 2 — Deploy su Render (10 min)

### 2.1 Crea il Web Service
1. Vai su https://dashboard.render.com
2. **New +** → **Web Service**
3. **Connect a repository** → scegli `meikasait`
4. Compila:
   - **Name**: `meikasait` (sarà il sottodominio: `meikasait.onrender.com`)
   - **Region**: **Frankfurt (EU Central)** ← ⚠️ importante per l'Italia
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: **Free**

### 2.2 Variabili d'ambiente (Environment)
Prima di cliccare Create, scorri fino a **Environment Variables** e aggiungi:

| KEY | VALUE | Note |
|-----|-------|------|
| `NODE_ENV` | `production` | Attiva HTTPS strict + cookie Secure |
| `SESSION_SECRET` | *(clicca "Generate")* | Chiave casuale per firmare le sessioni |
| `ADMIN_USER` | `admin` | O username che preferisci |
| `ADMIN_PASS_HASH` | *(vedi 2.3 sotto)* | Hash bcrypt della tua password |
| `RP_ID` | `meikasa.it` | Necessario per passkey — vedi nota sotto |
| `ORIGIN` | `https://meikasa.it` | URL completo del dominio |

> **Nota RP_ID/ORIGIN**: se hai un piano gratuito iniziale, imposta prima `RP_ID=meikasait.onrender.com` e `ORIGIN=https://meikasait.onrender.com`. Quando avrai collegato il dominio Aruba, cambiali in `meikasa.it` / `https://meikasa.it`.

### 2.3 Genera l'hash della password admin
**Sul tuo PC** (non su Render), nella cartella del progetto:

```bash
npm install       # se non l'hai già fatto
node tools/hash-password.js
```

Ti chiede la password → ti sputa un hash tipo `$2a$12$AbCdEfGh...`. **Copia** quell'hash e incollalo come valore di `ADMIN_PASS_HASH` su Render.

### 2.4 Crea il servizio
Clicca **Create Web Service**. Render fa build + deploy: 2–4 minuti.

Quando vedi **"Live"** in verde in alto, apri l'URL: `https://meikasait.onrender.com`

**Login admin**: `https://meikasait.onrender.com/admin` → `admin` / *(la tua password)*

---

## PARTE 3 — Collega il dominio Aruba `meikasa.it` (15 min + attesa DNS)

### 3.1 Aggiungi il dominio su Render
1. Nel tuo servizio Render → **Settings** (menu a sinistra) → **Custom Domains**
2. Click **Add Custom Domain**
3. Inserisci: `meikasa.it` → **Save**
4. Ripeti aggiungendo anche `www.meikasa.it`

Render ti mostrerà **2 record DNS** da configurare. Li elenco qui sotto, ma **usa sempre i valori esatti che ti dà Render** (potrebbero cambiare):

- **Record A per `meikasa.it`**: `216.24.57.1` (o simile)
- **Record CNAME per `www.meikasa.it`**: `meikasait.onrender.com`

### 3.2 Configura il DNS su Aruba

1. Vai su https://admin.aruba.it → login
2. Menu **I tuoi domini** → click su `meikasa.it`
3. Cerca la voce **DNS e Server DNS** (o **Gestione DNS** / **Zona DNS**)
4. Verifica di essere sui **DNS di Aruba** (default). Se sei su DNS personalizzati, prima riporta ai DNS Aruba.
5. Nella **Gestione zona DNS** aggiungi/modifica questi record:

| Tipo | Nome (host) | Valore | TTL |
|------|-------------|--------|-----|
| **A** | `@` (o vuoto, oppure `meikasa.it`) | `216.24.57.1` *(quello di Render)* | 3600 |
| **CNAME** | `www` | `meikasait.onrender.com.` *(nota il punto finale)* | 3600 |

⚠️ **Elimina eventuali record A/AAAA/CNAME preesistenti** su `@` e `www` che puntano ad altro (es. parcheggio Aruba, hosting default). Altrimenti fanno conflitto.

6. **Conferma** e salva.

### 3.3 Aspetta la propagazione DNS
- **Tempi tipici Aruba**: 15 min – 2 ore
- **Massimo**: 24 ore (raro)

Verifica quando è pronto: apri https://dnschecker.org/#A/meikasa.it → l'IP di Render deve comparire ovunque nel mondo.

### 3.4 Attiva HTTPS gratuito
Torna su Render → **Custom Domains**: quando il DNS è propagato, Render **automaticamente** rilascia il certificato SSL Let's Encrypt (2–5 min). Vedrai il pallino verde ✅.

Da quel momento https://meikasa.it è online 🎉

### 3.5 Redirect www → non-www (o viceversa)
Su Render → **Settings** → **Redirects/Rewrites** puoi impostare che `www.meikasa.it` rediriga a `meikasa.it` (o viceversa). Consigliato: **`www` → non-www**.

### 3.6 Aggiorna RP_ID e ORIGIN (per le passkey)
Ora che il dominio è live, **importantissimo**:
1. Render → Environment Variables
2. Cambia:
   - `RP_ID` = `meikasa.it`
   - `ORIGIN` = `https://meikasa.it`
3. Save → Render fa un redeploy automatico

Se avevi già registrato passkey su `meikasait.onrender.com`, dovrai **rifarle** (accedi con password, poi vai su 🛡️ Sicurezza → Registra passkey).

---

## ✉️ Email professionale (bonus)

Il sito usa `wimeikasait@gmail.com`. Se vuoi un'email `@meikasa.it`:
- **Aruba** vende caselle email da ~5€/anno → menu "Email" nel tuo pannello Aruba
- Oppure **Google Workspace** ~7€/mese (più professionale, con Gmail)
- Oppure inoltro gratuito: molti registrar (incluso Aruba) permettono di creare un alias `info@meikasa.it` che gira le mail su Gmail

---

## 🔄 Deploy di modifiche future

Da oggi in poi, quando vuoi aggiornare il sito:

```bash
# nel PC, cartella meikasait/
git add .
git commit -m "Aggiornamento: [descrivi cosa hai cambiato]"
git push
```

Render rileva il push e fa il deploy automatico (**2–3 minuti**).

⚠️ **I contenuti modificati dal pannello admin** (testi, colori, immagini) sono salvati in `data/content.json`. Sul piano Free di Render, questo file **si azzera ad ogni redeploy** perché il disco non è persistente.

### Soluzione: disco persistente su Render
- Piano **Starter** ($7/mese): permette di attaccare un disco persistente da 1 GB
- Nel servizio → **Settings** → **Disks** → **Add Disk**
  - Name: `meikasait-data`
  - Mount Path: `/opt/render/project/src/data`
  - Size: 1 GB

Così `data/content.json`, `data/admin-users.json` e `public/uploads/` **restano** tra i deploy.

### Alternativa gratuita (workaround)
- Modifica i contenuti in locale → committali su Git → push
- I contenuti sono in `data/content.json`: tienili in Git anche loro

---

## 🆘 Non riesci a entrare in admin? (RESET EMERGENZA)

Se in produzione perdi la password admin o le passkey ti bloccano:

1. **Sul PC**, nella cartella del progetto:
   ```bash
   node tools/unlock-admin.js admin "NuovaPasswordSicura!"
   ```
2. `git add data/admin-users.json && git commit -m "Reset admin" && git push`
3. Render redeploya → puoi rientrare

**Oppure** (solo se hai disco persistente): SSH nel servizio Render, poi:
```bash
cd /opt/render/project/src
node tools/unlock-admin.js admin "NuovaPasswordSicura!"
```

---

## 📊 Checklist finale

- [ ] Repo su GitHub con l'ultimo push
- [ ] Web Service su Render "Live"
- [ ] `ADMIN_PASS_HASH` impostato con hash reale (non default!)
- [ ] `SESSION_SECRET` generato
- [ ] Dominio `meikasa.it` + `www.meikasa.it` aggiunti su Render
- [ ] Record A e CNAME configurati su Aruba
- [ ] DNS propagato (verificato su dnschecker.org)
- [ ] HTTPS attivo (pallino verde ✅ su Render)
- [ ] `RP_ID` e `ORIGIN` aggiornati al dominio reale
- [ ] Test: apri https://meikasa.it → sito online
- [ ] Test: apri https://meikasa.it/admin → login funzionante
- [ ] Registra almeno una passkey su un dispositivo (backup!)

---

## 💡 Consigli finali

- **Backup**: ogni tanto scarica `data/content.json` dal server (o clona la repo GitHub aggiornata) per non perdere i contenuti
- **Sitemap**: `https://meikasa.it/sitemap.xml` è già generata → aggiungila in [Google Search Console](https://search.google.com/search-console)
- **Analytics privacy-friendly**: aggiungi [Plausible](https://plausible.io) o [Umami](https://umami.is) invece di GA4 (niente cookie banner obbligatorio per loro)
- **Email marketing**: per la newsletter marketing → [Brevo (Sendinblue)](https://www.brevo.com) è gratis fino a 300 email/giorno
