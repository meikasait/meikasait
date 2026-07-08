/* =========================================================================
   Genera un segreto TOTP e il QR code per Google Authenticator / Authy.
   Uso:
     node tools/setup-totp.js
   Poi:
     1) scansiona il QR (o inserisci il segreto a mano) nell'app authenticator
     2) copia ADMIN_TOTP_SECRET nelle variabili d'ambiente di Render
   ========================================================================= */
const { authenticator } = require("otplib");
const QRCode = require("qrcode");

const user = process.argv[2] || process.env.ADMIN_USER || "admin";
const issuer = "Meikasait Admin";
const secret = authenticator.generateSecret();
const uri = authenticator.keyuri(user, issuer, secret);

(async () => {
  console.log("\n=================== SETUP TOTP (2FA) ===================\n");
  console.log("1) Apri Google Authenticator / Authy / 1Password");
  console.log("2) Scansiona questo QR code (nel terminale):\n");
  try {
    const ascii = await QRCode.toString(uri, { type: "terminal", small: true });
    console.log(ascii);
  } catch (e) {
    console.log("(impossibile disegnare il QR nel terminale, usa il segreto qui sotto)\n");
  }
  console.log("   ...oppure inserisci manualmente questo segreto nell'app:\n");
  console.log("   " + secret + "\n");
  console.log("3) Imposta su Render questa variabile d'ambiente:\n");
  console.log("   ADMIN_TOTP_SECRET=" + secret + "\n");
  console.log("   (Conserva il segreto in un posto sicuro: è la tua chiave di backup)\n");
  console.log("========================================================\n");
})();
