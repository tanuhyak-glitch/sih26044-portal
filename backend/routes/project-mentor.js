const express = require("express");
const { load, save, nextId } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const CAREER_CATALOG = require("../data/careerCatalog");
const TEMPLATES = require("../data/projectTemplates");

const router = express.Router();
const LEVELS = ["beginner", "intermediate", "advanced"];

function findProfile(db, userId) {
  return db.studentProfiles.find((p) => p.userId === userId);
}

function readinessToLevel(readiness) {
  if (readiness < 40) return "beginner";
  if (readiness < 75) return "intermediate";
  return "advanced";
}

// Suggest a project. If the student has a career goal and hasn't
// overridden the level, the level is inferred from their roadmap
// readiness (see career.js) so beginners aren't handed an advanced brief.
router.post("/suggest", requireAuth, requireRole("student"), (req, res) => {
  const { careerKey, level, teamSize, notes } = req.body || {};
  const db = load();
  const profile = findProfile(db, req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found." });

  const resolvedCareerKey = careerKey || profile.careerGoal;
  const career = CAREER_CATALOG.find((c) => c.key === resolvedCareerKey);
  if (!career) {
    return res.status(400).json({
      error: "Choose a career track first (either pass careerKey, or set one on the Career & Roadmap tab).",
    });
  }

  let resolvedLevel = level && LEVELS.includes(level) ? level : null;
  if (!resolvedLevel) {
    const skills = new Set((profile.skills || []).map((s) => s.skillName.toLowerCase()));
    const roadmapLevels = career.roadmap.map((step) => {
      const match = (profile.skills || []).find((s) => s.skillName.toLowerCase() === step.skillName.toLowerCase());
      const cur = match ? match.level : 0;
      return Math.min(cur, step.minLevel) / step.minLevel;
    });
    const readiness = Math.round((roadmapLevels.reduce((a, b) => a + b, 0) / roadmapLevels.length) * 100);
    resolvedLevel = readinessToLevel(readiness);
  }

  const template = TEMPLATES[career.key] && TEMPLATES[career.key][resolvedLevel];
  if (!template) {
    return res.status(404).json({ error: "No template available for this combination yet." });
  }

  const suggestion = {
    id: nextId(db, "certificates") + 900000, // cheap unique-ish id without a dedicated counter
    careerKey: career.key,
    careerLabel: career.label,
    level: resolvedLevel,
    teamSize: teamSize || "individual",
    notes: notes || "",
    ...template,
    generatedAt: new Date().toISOString(),
  };

  // Keep a lightweight history on the profile so "My Projects" can list
  // past suggestions without a new top-level collection.
  profile.mentorSuggestions = profile.mentorSuggestions || [];
  profile.mentorSuggestions.unshift(suggestion);
  profile.mentorSuggestions = profile.mentorSuggestions.slice(0, 10);
  save(db);

  res.json({ suggestion, explanation: `Matched to ${career.label} at ${resolvedLevel} level based on your current roadmap progress.` });
});

router.get("/history", requireAuth, requireRole("student"), (req, res) => {
  const db = load();
  const profile = findProfile(db, req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found." });
  res.json({ suggestions: profile.mentorSuggestions || [] });
});

module.exports = router;
