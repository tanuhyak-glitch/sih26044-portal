// utils/otp.js
// Small helper for one-time-password (OTP) email verification during
// registration. The OTP itself is never stored in plaintext — only a
// bcrypt hash of it — the same way passwords are handled.

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function generateOtp() {
  // 6-digit numeric code, e.g. "042198"
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

function hashOtp(otp) {
  return bcrypt.hashSync(otp, 8);
}

function verifyOtp(otp, otpHash) {
  return bcrypt.compareSync(String(otp || ""), otpHash);
}

function newExpiry() {
  return Date.now() + OTP_TTL_MS;
}

function isExpired(expiresAt) {
  return Date.now() > expiresAt;
}

module.exports = { generateOtp, hashOtp, verifyOtp, newExpiry, isExpired, MAX_ATTEMPTS };
