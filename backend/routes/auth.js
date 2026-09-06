const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { load, save, nextId } = require("../db");
const { JWT_SECRET, requireAuth } = require("../middleware/auth");
const { generateOtp, hashOtp, verifyOtp, newExpiry, isExpired, MAX_ATTEMPTS } = require("../utils/otp");
const { sendOtpEmail } = require("../utils/mailer");
const { PROVIDERS } = require("../utils/oauth");

const router = express.Router();
const VALID_ROLES = ["student", "industry", "college", "admin"];
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, orgName: user.orgName },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

function emailTaken(db, email) {
  return db.users.some((u) => u.email.toLowerCase() === email);
}

function createStudentProfile(db, userId, extra = {}) {
  db.studentProfiles.push({
    userId,
    collegeUserId: extra.collegeUserId || null,
    branch: extra.branch || "",
    year: extra.year || "",
    degree: extra.degree || "",
    semester: extra.semester || "",
    bio: "",
    skills: [],
    completedCourses: [],
    projects: [],
    internships: [],
    interests: [],
    careerStatus: null, // "known" | "exploring" | "unsure"
    careerGoal: null, // career catalog key, set via /api/career
    freeTimeSlots: [], // used by /api/planner
    mentorSuggestions: [], // history from /api/project-mentor
    githubUrl: extra.githubUrl || "",
    linkedinUrl: extra.linkedinUrl || "",
    onboardingComplete: false,
  });
}

function createUser(db, { name, email, passwordHash, role, orgName, authProvider }) {
  const id = nextId(db, "users");
  const user = {
    id,
    name: name.trim(),
    email,
    passwordHash: passwordHash || null,
    role,
    orgName: orgName ? orgName.trim() : "",
    authProvider: authProvider || "password",
  };
  db.users.push(user);
  return user;
}

// ---------------------------------------------------------------------
// Step 1 of registration: validate details, generate an OTP, and email
// it. No user account exists yet — the pending registration is only
// promoted to a real account once the OTP is verified below.
// ---------------------------------------------------------------------
router.post("/register/start", async (req, res) => {
  const { name, email, password, role, orgName, branch, year, collegeId, degree, semester } = req.body || {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Name, email, password and role are required." });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: "Role must be one of: student, industry, college, admin." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const db = load();
  const emailNormalised = email.trim().toLowerCase();
  if (emailTaken(db, emailNormalised)) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const otp = generateOtp();
  const pending = {
    id: nextId(db, "pendingRegistrations"),
    email: emailNormalised,
    name,
    passwordHash: bcrypt.hashSync(password, 8),
    role,
    orgName: orgName || "",
    branch: branch || "",
    year: year || "",
    degree: degree || "",
    semester: semester || "",
    collegeId: collegeId || null,
    otpHash: hashOtp(otp),
    otpExpiresAt: newExpiry(),
    attempts: 0,
    createdAt: new Date().toISOString(),
  };

  // Replace any earlier pending registration for the same email.
  db.pendingRegistrations = db.pendingRegistrations.filter((p) => p.email !== emailNormalised);
  db.pendingRegistrations.push(pending);
  save(db);

  const mailResult = await sendOtpEmail(emailNormalised, otp);
  res.status(200).json({
    message: "Verification code sent to your email.",
    email: emailNormalised,
    // Only present when no SMTP is configured, so a judge's laptop can
    // still complete the demo without a mail account. Never sent once
    // real SMTP credentials are set in .env.
    devOtp: mailResult.delivered ? undefined : otp,
  });
});

// Step 2: verify the OTP and turn the pending registration into a real,
// logged-in account.
router.post("/register/verify", (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and code are required." });
  }
  const db = load();
  const emailNormalised = email.trim().toLowerCase();
  const pending = db.pendingRegistrations.find((p) => p.email === emailNormalised);
  if (!pending) {
    return res.status(400).json({ error: "No pending registration found for this email. Please start again." });
  }
  if (isExpired(pending.otpExpiresAt)) {
    db.pendingRegistrations = db.pendingRegistrations.filter((p) => p.id !== pending.id);
    save(db);
    return res.status(400).json({ error: "This code has expired. Please request a new one." });
  }
  if (pending.attempts >= MAX_ATTEMPTS) {
    db.pendingRegistrations = db.pendingRegistrations.filter((p) => p.id !== pending.id);
    save(db);
    return res.status(429).json({ error: "Too many incorrect attempts. Please start registration again." });
  }
  if (!verifyOtp(otp, pending.otpHash)) {
    pending.attempts += 1;
    save(db);
    return res.status(400).json({ error: "Incorrect code. Please try again." });
  }

  if (emailTaken(db, emailNormalised)) {
    db.pendingRegistrations = db.pendingRegistrations.filter((p) => p.id !== pending.id);
    save(db);
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const user = createUser(db, {
    name: pending.name,
    email: pending.email,
    passwordHash: pending.passwordHash,
    role: pending.role,
    orgName: pending.orgName,
  });

  if (pending.role === "student") {
    const college = pending.collegeId
      ? db.users.find((u) => u.id === Number(pending.collegeId) && u.role === "college")
      : null;
    createStudentProfile(db, user.id, {
      collegeUserId: college ? college.id : null,
      branch: pending.branch,
      year: pending.year,
      degree: pending.degree,
      semester: pending.semester,
    });
  }

  db.pendingRegistrations = db.pendingRegistrations.filter((p) => p.id !== pending.id);
  save(db);

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

// Resend a fresh OTP for a pending registration.
router.post("/register/resend", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email is required." });
  const db = load();
  const emailNormalised = email.trim().toLowerCase();
  const pending = db.pendingRegistrations.find((p) => p.email === emailNormalised);
  if (!pending) {
    return res.status(400).json({ error: "No pending registration found for this email. Please start again." });
  }
  const otp = generateOtp();
  pending.otpHash = hashOtp(otp);
  pending.otpExpiresAt = newExpiry();
  pending.attempts = 0;
  save(db);
  const mailResult = await sendOtpEmail(emailNormalised, otp);
  res.json({ message: "A new code has been sent.", devOtp: mailResult.delivered ? undefined : otp });
});

// Password login (unchanged behaviour, still available alongside OTP
// registration and OAuth).
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  const db = load();
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || !user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  const db = load();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: publicUser(user) });
});

// -----------------------------------------------------------------------
// OAuth (Google / GitHub / LinkedIn). A provider is only usable once its
// client id/secret are set in backend/.env — see .env.example. `state` is
// a short-lived, single-use random token that carries the intended role
// across the redirect to the provider and back.
// -----------------------------------------------------------------------
const oauthStates = new Map(); // state -> { role, createdAt }
const STATE_TTL_MS = 10 * 60 * 1000;

function cleanupStates() {
  const now = Date.now();
  for (const [key, val] of oauthStates) {
    if (now - val.createdAt > STATE_TTL_MS) oauthStates.delete(key);
  }
}

router.get("/oauth/:provider", (req, res) => {
  const provider = PROVIDERS[req.params.provider];
  if (!provider) return res.status(404).json({ error: "Unknown provider." });
  if (!provider.enabled()) {
    return res
      .status(503)
      .json({ error: `${req.params.provider} login isn't configured on this server yet.` });
  }
  cleanupStates();
  const role = VALID_ROLES.includes(req.query.role) ? req.query.role : "student";
  const state = crypto.randomBytes(16).toString("hex");
  oauthStates.set(state, { role, createdAt: Date.now() });
  res.redirect(provider.authorizeUrl(state));
});

router.get("/oauth/:provider/callback", async (req, res) => {
  const providerName = req.params.provider;
  const provider = PROVIDERS[providerName];
  if (!provider) return res.status(404).send("Unknown provider.");

  const { code, state, error } = req.query;
  if (error) return res.redirect(`${FRONTEND_URL}/oauth/callback?error=${encodeURIComponent(error)}`);

  const stateEntry = oauthStates.get(state);
  oauthStates.delete(state);
  if (!code || !stateEntry) {
    return res.redirect(`${FRONTEND_URL}/oauth/callback?error=invalid_state`);
  }

  try {
    const accessToken = await provider.exchange(code);
    const profile = await provider.profile(accessToken);
    if (!profile.email) {
      return res.redirect(`${FRONTEND_URL}/oauth/callback?error=no_email_from_provider`);
    }

    const db = load();
    const emailNormalised = profile.email.trim().toLowerCase();
    let user = db.users.find((u) => u.email.toLowerCase() === emailNormalised);

    if (!user) {
      user = createUser(db, {
        name: profile.name || emailNormalised,
        email: emailNormalised,
        passwordHash: null,
        role: stateEntry.role,
        authProvider: providerName,
      });
      if (stateEntry.role === "student") {
        createStudentProfile(db, user.id, {
          githubUrl: profile.githubUrl || "",
          linkedinUrl: profile.linkedinUrl || "",
        });
      }
      save(db);
    }

    const token = signToken(user);
    res.redirect(`${FRONTEND_URL}/oauth/callback?token=${encodeURIComponent(token)}`);
  } catch (e) {
    console.error("OAuth error:", e.message);
    res.redirect(`${FRONTEND_URL}/oauth/callback?error=${encodeURIComponent(e.message)}`);
  }
});

// Lets the frontend know which OAuth buttons to show without exposing
// any secrets.
router.get("/oauth-providers", (req, res) => {
  res.json({
    google: PROVIDERS.google.enabled(),
    github: PROVIDERS.github.enabled(),
    linkedin: PROVIDERS.linkedin.enabled(),
  });
});

module.exports = router;
