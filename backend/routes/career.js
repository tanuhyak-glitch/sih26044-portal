const express = require("express");
const { load, save } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const CAREER_CATALOG = require("../data/careerCatalog");

const router = express.Router();

function findProfile(db, userId) {
  return db.studentProfiles.find((p) => p.userId === userId);
}

function studentLevel(profile, skillName) {
  const match = (profile.skills || []).find(
    (s) => s.skillName.toLowerCase() === skillName.toLowerCase()
  );
  return match ? match.level : 0;
}

// Builds the personalised roadmap + skill gap + an explainable readiness
// score for one career track, given a student's current declared skills.
function buildRoadmap(career, profile) {
  const steps = career.roadmap.map((step) => {
    const level = studentLevel(profile, step.skillName);
    let status;
    if (level === 0) status = "missing";
    else if (level < step.minLevel) status = "developing";
    else status = "strong";
    return {
      skillName: step.skillName,
      requiredLevel: step.minLevel,
      currentLevel: level,
      status,
      progress: Math.round((Math.min(level, step.minLevel) / step.minLevel) * 100),
    };
  });

  const readiness = Math.round(
    steps.reduce((sum, s) => sum + s.progress, 0) / steps.length
  );

  const nextStep = steps.find((s) => s.status !== "strong") || null;

  return {
    careerKey: career.key,
    label: career.label,
    description: career.description,
    steps,
    readiness,
    nextStep,
  };
}

// Public catalog — used both to let a student pick a career and to power
// the "Career Fit and Comparison" list (fit % shown alongside each option).
router.get("/catalog", requireAuth, requireRole("student"), (req, res) => {
  const db = load();
  const profile = findProfile(db, req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found." });

  const catalog = CAREER_CATALOG.map((career) => {
    const built = buildRoadmap(career, profile);
    return {
      key: career.key,
      label: career.label,
      description: career.description,
      fitScore: built.readiness,
      selected: profile.careerGoal === career.key,
    };
  }).sort((a, b) => b.fitScore - a.fitScore);

  res.json({
    catalog,
    // Mirrors the brief's requirement to never claim certainty about a
    // student's future.
    disclaimer:
      "Fit % reflects how much of each career's typical skill roadmap you've already covered — not a prediction of your future success.",
  });
});

// Current career goal + personalised roadmap/skill-gap/readiness. Returns
// null goal (not an error) if the student hasn't chosen one yet.
router.get("/me", requireAuth, requireRole("student"), (req, res) => {
  const db = load();
  const profile = findProfile(db, req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found." });

  if (!profile.careerGoal) {
    return res.json({ careerGoal: null, roadmap: null });
  }
  const career = CAREER_CATALOG.find((c) => c.key === profile.careerGoal);
  if (!career) return res.json({ careerGoal: null, roadmap: null });

  res.json({ careerGoal: profile.careerGoal, roadmap: buildRoadmap(career, profile) });
});

// Select (or change) a career goal.
router.put("/me", requireAuth, requireRole("student"), (req, res) => {
  const { careerKey } = req.body || {};
  const career = CAREER_CATALOG.find((c) => c.key === careerKey);
  if (!career) return res.status(400).json({ error: "Unknown career key." });

  const db = load();
  const profile = findProfile(db, req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found." });

  profile.careerGoal = careerKey;
  save(db);

  res.json({ careerGoal: careerKey, roadmap: buildRoadmap(career, profile) });
});

module.exports = router;
