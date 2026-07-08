/* =========================================================================
   Crea un utente admin nel file data/admin-users.json

   Uso rapido:
     node tools/create-admin.js username email password ruolo

   Esempio:
     node tools/create-admin.js domenico domenico@email.it "PasswordSicura!2026" owner

   Ruoli disponibili:
     owner       = pieno controllo, compresi altri owner
     superadmin  = gestisce utenti, sicurezza e contenuti
     admin       = gestione contenuti
     editor      = modifiche contenuti base
   ========================================================================= */

const auth = require("../lib/auth");

const [username, email, password, role = "editor"] = process.argv.slice(2);

if (!username || !password) {
  console.log(`\nUso:\n  node tools/create-admin.js username email password ruolo\n\nEsempio:\n  node tools/create-admin.js domenico domenico@email.it "PasswordSicura!2026" owner\n`);
  process.exit(1);
}

try {
  const user = auth.createUser({ username, email, password, role }, { role: "owner" });
  console.log("\n✅ Utente creato:\n");
  console.log(JSON.stringify(user, null, 2));
  console.log("\nOra accedi a /admin con username/password e poi registra una passkey dalla scheda Sicurezza.\n");
} catch (e) {
  console.error("\n❌ Errore:", e.message, "\n");
  process.exit(1);
}
