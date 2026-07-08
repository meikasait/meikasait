# Gestione utenti admin Meikasait

Il pannello `/admin` ora supporta più utenti con ruoli e passkey personali.

## Ruoli

- `owner`: controllo completo, può creare anche altri owner.
- `superadmin`: può gestire utenti, sicurezza e contenuti.
- `admin`: gestione contenuti.
- `editor`: modifiche contenuti base.

## Primo utente

Se `data/admin-users.json` non esiste, il server crea automaticamente un primo utente usando:

```text
ADMIN_USER
ADMIN_EMAIL
ADMIN_PASS_HASH
ADMIN_PASS
ADMIN_PASSKEY
```

Se non imposti nulla, il fallback è:

```text
username: admin
password: meikasait2026
ruolo: owner
```

Da cambiare subito.

## Creare un utente da terminale

Dentro la cartella del progetto:

```bash
node tools/create-admin.js username email password ruolo
```

Esempio:

```bash
node tools/create-admin.js domenico domenico@email.it "PasswordSicura!2026" owner
node tools/create-admin.js carmine carmine@email.it "AltraPassword!2026" superadmin
```

## Creare un utente dal pannello

Accedi come `owner` o `superadmin`, poi vai su:

```text
/admin → Utenti
```

Da lì puoi:

- creare utenti
- modificare username/email/ruolo
- attivare/disattivare utenti
- resettare password
- rimuovere passkey

## Aggiungere una passkey

Ogni utente deve accedere con username/password, poi andare su:

```text
/admin → Sicurezza → Registra passkey
```

Dopo aver registrato almeno una passkey, il login di quell'utente diventa:

```text
password + passkey
```

La passkey viene salvata in `data/admin-users.json`, quindi non devi più copiare `ADMIN_PASSKEY` nelle variabili d'ambiente.

## Nota produzione

Per le passkey in produzione imposta correttamente:

```text
RP_ID=tuodominio.it
ORIGIN=https://tuodominio.it
SESSION_SECRET=stringa_lunga_casuale
```

Se usi Render:

```text
RP_ID=nome-app.onrender.com
ORIGIN=https://nome-app.onrender.com
```

Le passkey funzionano solo su `localhost` oppure su domini HTTPS.
