/* =========================================================================
   Sblocco emergenza admin.

   Crea o aggiorna un utente owner attivo e, di default, rimuove le passkey
   così puoi entrare solo con username + password e poi riconfigurare tutto.

   Uso:
     node tools/unlock-admin.js username "PasswordSicura" [email]

   Esempio:
     node tools/unlock-admin.js rescue "PasswordSicura!2026" rescue@email.it
   ========================================================================= */

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
require("../lib/auth"); // assicura la creazione del file se manca

const USERS_FILE = path.join(__dirname, "..", "data", "admin-users.json");
const [username, password, email = ""] = process.argv.slice(2);

if (!username || !password || password.length < 8) {
  console.log(`\nUso:\n  node tools/unlock-admin.js username "PasswordSicura" [email]\n`);
  process.exit(1);
}

const store = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
const norm = (v) => String(v || "").trim().toLowerCase();
let user = store.users.find((u) => norm(u.username) === norm(username) || (email && norm(u.email) === norm(email)));

if (!user) {
  user = {
    id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex"),
    username,
    email,
    role: "owner",
    active: true,
    passwordHash: "",
    passkeys: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: "",
  };
  store.users.push(user);
}

user.username = username;
user.email = email || user.email || "";
user.role = "owner";
user.active = true;
user.passwordHash = bcrypt.hashSync(password, 12);
user.passkeys = [];
user.updatedAt = new Date().toISOString();

fs.writeFileSync(USERS_FILE, JSON.stringify(store, null, 2), "utf8");

console.log("\n✅ Admin sbloccato.");
console.log(`Username: ${username}`);
console.log("Password: quella appena indicata");
console.log("Passkey rimosse: sì");
console.log("Ora riavvia il server e accedi a /admin.\n");
