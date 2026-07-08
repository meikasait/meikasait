# 🚀 Guida alla pubblicazione — Meikasait

Questa guida ti porta da zero a sito online su **GitHub + Render**, con il pannello di amministrazione funzionante, in modo che il tuo collega possa testarlo da un link.

---

## 0. Cosa contiene il progetto

```
meikasait/
├── index.html            → homepage (renderizzata dalla configurazione)
├── privacy.html          → pagina Privacy & Cookie Policy
├── server.js             → backend Node/Express (sito + admin + API)
├── package.json          → dipendenze
├── render.yaml           → configurazione automatica per Render (opzionale)
├── assets/               → CSS, JavaScript e immagini dei pacchetti
├── data/content.json     → TUTTI i contenuti modificabili dal pannello
├── admin/                → pannello di amministrazione (/admin)
└── public/uploads/       → immagini caricate dal pannello
```

---

## 1. Provalo prima in locale (consigliato)

1. Installa **Node.js 18+** da https://nodejs.org
2. Apri il terminale nella cartella `meikasait` ed esegui:

   ```bash
   npm install
   npm start
   ```
3. Apri nel browser:
   - Sito: **http://localhost:4000**
   - Pannello admin: **http://localhost:4000/admin**
     - Utente: `admin`
     - Password: `meikasait2026`
4. Nel pannello modifica testi/colori/immagini, premi **💾 Salva modifiche**, poi ricarica il sito per vedere il risultato.

> ⚠️ Cambia utente e password prima di andare online (vedi punto 4).

---

## 2. Carica il progetto su GitHub

### A. Crea il repository
1. Vai su https://github.com → in alto a destra **+** → **New repository**.
2. Nome: `meikasait` (o quello che preferisci). Lascialo **Public** o **Private** (Render funziona con entrambi).
3. **Non** aggiungere README/gitignore (li abbiamo già). Clicca **Create repository**.

### B. Carica i file
**Modo semplice (senza terminale):**
1. Nella pagina del repo appena creato clicca **uploading an existing file**.
2. Trascina **tutti i file e le cartelle della cartella `meikasait`** (NON caricare `node_modules`).
3. Scrivi un messaggio (es. "primo caricamento") e clicca **Commit changes**.

**Modo con terminale (se preferisci Git):**
```bash
cd meikasait
git init
git add .
git commit -m "Primo caricamento Meikasait"
git branch -M main
git remote add origin https://github.com/TUO-UTENTE/meikasait.git
git push -u origin main
```

---

## 3. Pubblica su Render

1. Vai su https://render.com e registrati / accedi (puoi usare l'account GitHub).
2. In alto a destra: **New +** → **Web Service**.
3. Collega il tuo account GitHub e seleziona il repository **meikasait**.
4. Compila i campi così:
   - **Name:** `meikasait` (sarà parte dell'URL, es. `meikasait.onrender.com`)
   - **Region:** Frankfurt (la più vicina all'Italia)
   - **Branch:** `main`
   - **Runtime / Language:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** `Free`
5. Clicca **Create Web Service**.
6. Aspetta che il deploy finisca (qualche minuto): quando vedi **"Live"**, il sito è online.

> 💡 In alternativa, Render può leggere il file `render.yaml` incluso: scegli **New + → Blueprint** e seleziona il repo.

---

## 4. 🔐 Imposta utente e password dell'admin (IMPORTANTE)

Per non lasciare le credenziali di default:

1. Nella dashboard del servizio su Render → scheda **Environment** → **Add Environment Variable**.
2. Aggiungi:
   | Key | Value |
   |-----|-------|
   | `ADMIN_USER` | il tuo utente (es. `meikasait`) |
   | `ADMIN_PASS` | una password robusta |
   | `SESSION_SECRET` | una frase lunga e casuale |
3. Salva: Render farà un nuovo deploy automatico con le nuove credenziali.

Da quel momento accedi all'admin con le credenziali che hai scelto.

---

## 5. Manda il link al tuo collega

- **Sito da testare:** `https://meikasait.onrender.com` (l'URL esatto te lo dà Render)
- **Pannello admin:** `https://meikasait.onrender.com/admin`

Il tuo collega potrà navigare il sito, vedere il banner cookie all'ingresso, la pagina privacy e — se gli dai le credenziali — provare anche il pannello di gestione.

---

## ⚠️ Nota importante sul piano gratuito di Render

Sul **piano Free** il disco **non è permanente**: ad ogni nuovo deploy o riavvio, le immagini caricate da `/admin` e le modifiche salvate **potrebbero tornare allo stato del repository GitHub**.

Per i **test** va benissimo. Per la **versione definitiva** hai due opzioni:
1. **Più semplice:** quando il sito è "definitivo", scarica il `data/content.json` aggiornato e le immagini, e ricaricali su GitHub (così diventano permanenti).
2. **Più professionale:** passa a un piano Render con **Persistent Disk** montato su `data/` e `public/uploads/`, oppure usa uno storage esterno (es. Cloudinary/S3) per le immagini.

Se vuoi, posso predisporre una di queste due soluzioni.

---

## ❓ Problemi comuni

- **Il pannello `/admin` resta su "Caricamento configurazione…" o senza stile:** stai aprendo `admin/index.html` con doppio click (come file). Il pannello **richiede il server avviato**: usa `npm start` e apri `http://localhost:4000/admin` (in locale) oppure `https://TUO-SITO.onrender.com/admin` (online). Aperto come file non può funzionare perché ha bisogno delle API del server.
- **Il sito si apre ma è "spoglio":** stai aprendo `index.html` con doppio click invece che tramite il server. Apri sempre l'URL di Render o `http://localhost:4000`.
- **"Application failed to respond" su Render:** controlla che **Start Command** sia `node server.js` e che Node sia ≥18.
- **Non riesco ad accedere all'admin:** verifica le variabili `ADMIN_USER` / `ADMIN_PASS` nella scheda Environment.
- **Le immagini caricate spariscono:** è il limite del piano Free descritto sopra.
