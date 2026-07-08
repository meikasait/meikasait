/* =========================================================================
   Genera l'hash bcrypt della password admin.
   Uso:
     node tools/hash-password.js "LaMiaPasswordSicura"
   Poi copia il risultato nella variabile d'ambiente ADMIN_PASS_HASH su Render.
   ========================================================================= */
const bcrypt = require("bcryptjs");

const pwd = process.argv[2];
if (!pwd) {
  console.log("\nUso: node tools/hash-password.js \"LaTuaPassword\"\n");
  process.exit(1);
}
if (pwd.length < 8) {
  console.log("\n⚠️  Usa almeno 8 caratteri (meglio 12+ con maiuscole, numeri e simboli).\n");
}
const hash = bcrypt.hashSync(pwd, 12);
console.log("\n✅ Hash generato. Imposta su Render questa variabile d'ambiente:\n");
console.log("   ADMIN_PASS_HASH=" + hash + "\n");
console.log("   (e rimuovi ADMIN_PASS se l'avevi impostata)\n");
