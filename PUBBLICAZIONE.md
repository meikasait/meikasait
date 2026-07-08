# 🚀 Pubblicare Meikasait su GitHub + Render (guida rapida)

> Tempo richiesto: ~10 minuti. Non serve saper programmare: si fa tutto dal browser.

---

## PARTE 1 — Carica il sito su GitHub

### 1.1 Crea un account (se non ce l'hai)
Vai su **https://github.com** → **Sign up** e registrati (gratis).

### 1.2 Crea un nuovo repository
1. In alto a destra clicca il **+** → **New repository**.
2. **Repository name:** `meikasait`
3. Lascia **Public** (va benissimo) — oppure Private, funziona uguale.
4. **NON** spuntare "Add a README" (lo abbiamo già).
5. Clicca **Create repository**.

### 1.3 Carica i file
1. Nella pagina del repo appena creato, clicca il link **"uploading an existing file"**
   (in alto, nella riga *"…or push an existing repository / uploading an existing file"*).
2. **Scompatta lo ZIP `meikasait-sito.zip`** sul tuo computer: otterrai la cartella `meikasait`.
3. **Apri la cartella `meikasait`** e seleziona **TUTTO quello che c'è DENTRO**
   (i file `index.html`, `server.js`, `package.json`, e le cartelle `assets`, `admin`, `data`, `public`…).
   > ⚠️ Trascina il **contenuto** della cartella, non la cartella `meikasait` stessa.
   > ⚠️ NON caricare la cartella `node_modules` (se esiste): non serve.
4. Trascina i file nella zona di upload di GitHub.
5. In basso scrivi un messaggio (es. *"Primo caricamento"*) e clicca **Commit changes**.

✅ Fatto: il tuo codice è su GitHub.

---

## PARTE 2 — Pubblica su Render

### 2.1 Crea un account Render
Vai su **https://render.com** → **Get Started** → accedi **con GitHub**
(così Render vede subito i tuoi repository).

### 2.2 Crea il Web Service
1. Nella dashboard Render, in alto a destra: **New +** → **Web Service**.
2. Collega/autorizza GitHub se richiesto, poi **seleziona il repository `meikasait`**.
3. Compila i campi:

   | Campo | Valore |
   |-------|--------|
   | **Name** | `meikasait` (diventa parte dell'indirizzo, es. `meikasait.onrender.com`) |
   | **Region** | `Frankfurt (EU Central)` |
   | **Branch** | `main` |
   | **Runtime / Language** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node server.js` |
   | **Instance Type** | `Free` |

4. Clicca **Create Web Service**.
5. Attendi qualche minuto: quando vedi lo stato **"Live"** (in verde), il sito è online! 🎉

> 💡 In alternativa: **New + → Blueprint** e seleziona il repo: Render leggerà da solo il file `render.yaml` incluso.

### 2.3 Imposta utente e password dell'admin (consigliato)
Per non lasciare le credenziali di default:
1. Nel tuo servizio su Render → scheda **Environment** → **Add Environment Variable**.
2. Aggiungi queste tre variabili:

   | Key | Value |
   |-----|-------|
   | `ADMIN_USER` | il tuo utente (es. `meikasait`) |
   | `ADMIN_PASS` | una password robusta a tua scelta |
   | `SESSION_SECRET` | una frase lunga e casuale |

3. Salva → Render rifà il deploy automaticamente con le nuove credenziali.

---

## PARTE 3 — Manda il link al collega

Render ti dà un indirizzo tipo `https://meikasait.onrender.com`.

- **Sito da testare:** `https://meikasait.onrender.com`
- **Pannello di gestione:** `https://meikasait.onrender.com/admin`
  (entra con utente/password — quelli di default `admin` / `meikasait2026`, oppure quelli che hai impostato al punto 2.3)

Manda questi link al tuo collega: potrà vedere il sito, il banner cookie all'ingresso, la pagina privacy e — se gli dai le credenziali — anche il pannello admin.

---

## ⚠️ Importante (piano gratuito Render)

1. **Il sito "si addormenta":** sul piano Free, dopo ~15 min di inattività il sito va in pausa. Alla prima visita successiva ci mette **~30-50 secondi a ripartire**, poi è veloce. È normale.
2. **Le modifiche fatte dall'admin online non sono permanenti:** sul piano Free il disco si azzera ad ogni nuovo deploy/riavvio, quindi testi e immagini caricati da `/admin` potrebbero tornare a quelli del repository. Per i **test va benissimo**. Per la versione definitiva si usa un **disco persistente** (a pagamento) o si ricarica il `data/content.json` aggiornato su GitHub. Posso aiutarti quando sarai a quel punto.

---

## ❓ Se qualcosa non va

- **"Application failed to respond":** controlla che **Start Command** sia esattamente `node server.js`.
- **Build fallita:** controlla che **Build Command** sia `npm install` e che il file `package.json` sia stato caricato su GitHub.
- **/admin senza stile o bloccato:** apri sempre l'URL completo di Render (`…/admin`), mai un file scaricato.
