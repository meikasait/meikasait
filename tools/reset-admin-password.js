/* =========================================================================
   Reset password utente admin.

   Uso:
     node tools/reset-admin-password.js username "NuovaPassword" [--clear-passkeys]

   Esempio:
     node tools/reset-admin-password.js domenico "PasswordSicura!2026" --clear-passkeys
   ========================================================================= */

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const auth = require("../lib/auth");

const USERS_FILE = path.join(__dirname, "..", "data", "admin-users.json");
const [login, password, flag] = process.argv.slice(2);

if (!login || !password) {
  console.log(`\nUso:\n  node tools/reset-admin-password.js username "NuovaPassword" [--clear-passkeys]\n`);
  process.exit(1);
}

if (password.length < 8) {
  console.error("\n❌ La nuova password deve avere almeno 8 caratteri.\n");
  process.exit(1);
}

const store = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
const norm = (v) => String(v || "").trim().toLowerCase();
const user = store.users.find((u) => norm(u.username) === norm(login) || norm(u.email) === norm(login));

if (!user) {
  console.error(`\n❌ Utente non trovato: ${login}\n`);
  process.exit(1);
}

user.passwordHash = bcrypt.hashSync(password, 12);
user.active = true;
user.updatedAt = new Date().toISOString();

if (flag === "--clear-passkeys") {
  user.passkeys = [];
}

fs.writeFileSync(USERS_FILE, JSON.stringify(store, null, 2), "utf8");

console.log("\n✅ Password resettata correttamente.");
console.log(`Utente: ${user.username}`);
console.log(`Passkey: ${(user.passkeys || []).length}`);
if ((user.passkeys || []).length) {
  console.log("Nota: l'utente ha ancora passkey, quindi al login servirà anche il secondo fattore.");
  console.log("Per rimuoverle usa --clear-passkeys.");
}
console.log("");
