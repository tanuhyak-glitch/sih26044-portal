const express = require("express");
const { load, save, nextId } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Record a skill-level snapshot for the logged-in student. Call this
// whenever their skills change (e.g. after updating /students/me/skills)
// so progress can be tracked over time.
router.post("/snapshot", requireAuth, requireRole("student"), (req, res) => {
  const db = load();
  const profile = db.studentProfiles.find((p) => p.userId === req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found." });

  const id = nextId(db, "skillHistory");
  const entry = {
    id,
    studentUserId: req.user.id,
    skills: profile.skills,
    recordedAt: new Date().toISOString(),
  };
  db.skillHistory.push(entry);
  save(db);
  res.status(201).json({ snapshot: entry });
});

// View the logged-in student's skill history (before/after comparisons)
router.get("/mine", requireAuth, requireRole("student"), (req, res) => {
  const db = load();
  const history = db.skillHistory
    .filter((h) => h.studentUserId === req.user.id)
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
  res.json({ history });
});

module.exports = router;
