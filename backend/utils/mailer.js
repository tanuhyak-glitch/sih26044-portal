// utils/mailer.js
// Sends the OTP email. If SMTP credentials are present in the environment
// it sends a real email via nodemailer; otherwise (e.g. a judge's laptop
// with no mail account configured) it prints the OTP to the backend
// console so the demo still works end-to-end with zero setup.
//
// To send real emails, set these in backend/.env (see .env.example):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

let nodemailerTransport = null;

function getTransport() {
  if (nodemailerTransport !== null) return nodemailerTransport;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    nodemailerTransport = false; // mark as "checked, unavailable"
    return false;
  }
  // Only require nodemailer if it's actually configured, so the demo
  // doesn't need the package installed unless someone wants real email.
  const nodemailer = require("nodemailer");
  nodemailerTransport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return nodemailerTransport;
}

async function sendOtpEmail(toEmail, otp) {
  const transport = getTransport();
  if (!transport) {
    console.log(`\n[DEV EMAIL] OTP for ${toEmail}: ${otp} (valid 10 minutes)\n`);
    return { delivered: false, reason: "SMTP not configured — printed to server console instead." };
  }
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: "Your verification code",
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <b>${otp}</b>. It expires in 10 minutes.</p>`,
  });
  return { delivered: true };
}

module.exports = { sendOtpEmail };
