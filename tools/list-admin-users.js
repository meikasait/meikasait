/* Lista utenti admin senza mostrare hash/password */
const auth = require("../lib/auth");

const users = auth.listUsers();
console.log("\nUtenti admin configurati:\n");
for (const u of users) {
  console.log(`- ${u.username} | email: ${u.email || "-"} | ruolo: ${u.role} | attivo: ${u.active} | passkey: ${u.passkeysCount} | id: ${u.id}`);
}
console.log("");
