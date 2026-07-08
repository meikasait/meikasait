# Meikasait — Sito + pannello di gestione

> **Meikasait** (gioco di parole con _make-a-site_): siti web chiari, veloci e su misura — più gestione di contenuti e sponsorizzate social — fatti all'italiana, con metodo e un sorriso.

## Cosa contiene

- 🎨 **Sito vetrina** con palette italiana (verde basilico + rosso pomodoro + sabbia + cream), tipografia editoriale (Fraunces + Plus Jakarta Sans) e accenti tricolore discreti.
- 🛠️ **Backend di gestione** (`/admin`) per modificare **tutto** senza toccare il codice, con autenticazione multi-utente, **passkey WebAuthn** e ruoli.
- 🧩 **Sezioni modulari** attivabili/riordinabili dal pannello: Hero, **Servizi**, Vetrina lavori, **Marketing & Social**, Pacchetti, Contatti.
- 🪪 **Schede lavoro cliccabili** (`/lavoro/:slug`) come "prodotti": ogni progetto ha la sua pagina di dettaglio con panoramica generica, senza svelare funzioni o dati riservati del cliente.
- 📣 **Servizio marketing/social**: pacchetti di post mensili + sponsorizzate gestite per te. Gestione completa profili marcata come "in arrivo".
- 🍪 **Banner cookie**, 🔒 **Privacy & Cookie Policy** modificabile dal pannello.
- 🔎 **SEO out of the box**: meta tag dinamici, **OpenGraph**, **JSON-LD Organization**, **sitemap.xml** e **robots.txt** generati automaticamente, `/.well-known/security.txt`.
- ♿ **Accessibilità**: skip-link, focus visibili, `prefers-reduced-motion`, ARIA su menu e form.
- 🚀 **Pronto per GitHub + Render** (vedi `DEPLOY.md`).

---

## Avvio rapido

```bash
npm install
npm start
```

- Sito: <http://localhost:4000>
- Pannello admin: <http://localhost:4000/admin>
  - Utente: `admin` · Password: `meikasait2026` (cambiali in produzione!)

---

## Cosa puoi modificare dal pannello `/admin`

Tutto è organizzato in schede:

| Scheda | Cosa controlla |
|--------|----------------|
| 🎨 **Tema** | Tutti i colori (inclusi tricolore italiano), font heading e body (anche Google Fonts), dimensioni, raggio bordi |
| 🏷️ **Brand & Logo** | Nome, tagline, logo (lettera o immagine), email, telefono, Instagram |
| 🧭 **Menu** | Voci di navigazione e pulsante CTA |
| 📢 **Banner** | Banner promozionale on/off, testo, link, colori |
| 🧩 **Composizione** | Ordine e on/off di ciascuna sezione della home |
| 🚀 **Hero** | Titolo, testo, pulsanti, riquadri "in breve", step del metodo |
| ⚙️ **Servizi** | Card "cosa facciamo" (icona + titolo + testo + link) |
| 🖼️ **Vetrina lavori** | Carosello progetti + **scheda dettaglio per ogni lavoro** (panoramica, sfida, approccio, punti chiave, deliverable, stack, durata, galleria immagini). Slug personalizzabile per la URL. |
| 📣 **Marketing/Social** | Abbonamenti post + sponsorizzazioni, banner "coming soon" per gestione completa profili |
| 📦 **Pacchetti** | Pacchetti sito con immagine, prezzo, badge, caratteristiche |
| ✉️ **Contatti** | Testi del riquadro contatti e footer |
| 🔎 **SEO** | Title, description, OG image, keywords. Sitemap e robots automatici. |
| 🔒 **Privacy** | Dati usati nella Privacy & Cookie Policy |
| 🛡️ **Sicurezza** | Passkey (WebAuthn) + cambio password personale |
| 👥 **Utenti** | Crea, abilita/disabilita admin, assegna ruoli (Owner / Super Admin / Admin / Editor) |

Le immagini si possono **caricare direttamente** dal pannello (pulsante ⬆ Carica) o indicare via URL.

> Tutte le modifiche vengono salvate in `data/content.json`. Il front-end legge questo file e si aggiorna.

---

## Tono & stile

Mantiene un'aria **minimal & aesthetic** ma con **richiami italiani**: barra tricolore discreta nell'hero, palette ispirata a basilico/pomodoro/sabbia, copy con tocchi divertenti ma professionali ("Make-a-site. Ma sul serio.", "Sì, fatturiamo davvero.", "Il tuo sito invecchia come il vino, non come il pane.").

---

## Struttura del progetto

```
index.html          homepage (render dinamico, SPA-friendly)
privacy.html        privacy & cookie policy
assets/             styles.css, app.js, immagini pacchetti
data/content.json   tutta la configurazione del sito
data/users.json     utenti admin (creato al primo avvio)
admin/              pannello di gestione
server.js           server Express (sito + admin + API + sitemap + SPA routing)
lib/auth.js         autenticazione, ruoli, passkey
tools/              script CLI (hash password, setup TOTP, gestione utenti)
public/uploads/     immagini caricate dall'admin
```

---

## Schede lavoro cliccabili

Ogni progetto nella vetrina è un link a `/lavoro/<slug>`. La pagina mostra:

- Panoramica generica del progetto
- La sfida
- Il nostro approccio
- Punti chiave
- Cosa abbiamo consegnato + stack tecnologico
- Durata stimata
- Galleria immagini (opzionale)
- **Disclaimer di riservatezza**: non vengono mai svelati dettagli, dati o funzioni specifiche del cliente.

Tutto modificabile dal pannello **Vetrina lavori → Scheda dettaglio**.

---

## Pubblicazione

Vedi **`DEPLOY.md`** per la guida passo-passo a GitHub + Render e la condivisione del link col tuo collega.
