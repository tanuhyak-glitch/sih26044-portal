const express = require("express");
const { load, save } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { CAREERS, careersForCategory, degreeCategory, DISCOVERY_QUESTIONS } = require("../data/careers");

const router = express.Router();

function getProfile(db, userId) {
  return db.studentProfiles.find((p) => p.userId === userId);
}

// Compares the student's saved skills against a career's required skills.
// Matching is case-insensitive substring matching so "React" in a student's
// skill list still counts against "Frontend Framework (React)".
function computeGaps(studentSkills, career) {
  const have = (studentSkills || []).map((s) => String(s).toLowerCase());
  const matched = [];
  const missing = [];
  for (const skill of career.coreSkills) {
    const skillLower = skill.toLowerCase();
    const isMatched = have.some((s) => skillLower.includes(s) || s.includes(skillLower.split(" (")[0].trim().toLowerCase()));
    (isMatched ? matched : missing).push(skill);
  }
  const readiness = career.coreSkills.length ? Math.round((matched.length / career.coreSkills.length) * 100) : 0;
  return { matched, missing, readiness };
}

// GET /api/careers/options — career cards relevant to this student's degree.
router.get("/options", requireAuth, (req, res) => {
  const db = load();
  const profile = getProfile(db, req.user.id);
  if (!profile) return res.status(404).json({ error: "Student profile not found." });

  const category = degreeCategory(profile.degree);
  const careers = careersForCategory(category).map((c) => ({
    id: c.id,
    name: c.name,
    tagline: c.tagline,
  }));

  res.json({ category, careers, currentCareerGoal: profile.careerGoal || null });
});

// POST /api/careers/select { careerId } — student directly chooses a career.
router.post("/select", requireAuth, (req, res) => {
  const { careerId } = req.body || {};
  const career = CAREERS[careerId];
  if (!career) return res.status(400).json({ error: "Unknown career." });

  const db = load();
  const profile = getProfile(db, req.user.id);
  if (!profile) return res.status(404).json({ error: "Student profile not found." });

  profile.careerGoal = careerId;
  profile.careerStatus = "decided";
  save(db);

  const gaps = computeGaps(profile.skills, career);
  res.json({ career: { id: career.id, name: career.name, tagline: career.tagline, roadmap: career.roadmap }, ...gaps });
});

// GET /api/careers/roadmap — revisit the saved career + current gap analysis.
router.get("/roadmap", requireAuth, (req, res) => {
  const db = load();
  const profile = getProfile(db, req.user.id);
  if (!profile) return res.status(404).json({ error: "Student profile not found." });
  if (!profile.careerGoal || !CAREERS[profile.careerGoal]) {
    return res.status(404).json({ error: "No career selected yet." });
  }
  const career = CAREERS[profile.careerGoal];
  const gaps = computeGaps(profile.skills, career);
  res.json({ career: { id: career.id, name: career.name, tagline: career.tagline, roadmap: career.roadmap }, ...gaps });
});

// GET /api/careers/discovery-questions — for students who picked "Not sure".
router.get("/discovery-questions", requireAuth, (req, res) => {
  const questions = DISCOVERY_QUESTIONS.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options.map((o) => o.label),
  }));
  res.json({ questions });
});

// POST /api/careers/discovery-answer { answers: [{questionId, optionIndex}] }
// Scores every career in the student's degree category and returns the
// top 3 with a plain-language reason, never claiming certainty.
router.post("/discovery-answer", requireAuth, (req, res) => {
  const { answers } = req.body || {};
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "Answers are required." });
  }

  const db = load();
  const profile = getProfile(db, req.user.id);
  if (!profile) return res.status(404).json({ error: "Student profile not found." });

  const category = degreeCategory(profile.degree);
  const eligibleIds = new Set(careersForCategory(category).map((c) => c.id));

  const scores = {};
  const reasonHints = {}; // careerId -> array of matched option labels, for an explanation

  for (const ans of answers) {
    const question = DISCOVERY_QUESTIONS.find((q) => q.id === ans.questionId);
    if (!question) continue;
    const option = question.options[ans.optionIndex];
    if (!option) continue;
    for (const [careerId, weight] of Object.entries(option.weights)) {
      if (!eligibleIds.has(careerId)) continue; // stay within the student's degree category
      scores[careerId] = (scores[careerId] || 0) + weight;
      reasonHints[careerId] = reasonHints[careerId] || [];
      reasonHints[careerId].push(option.label);
    }
  }

  const maxPossible = answers.length * 3; // 3 is the highest weight used per question
  const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([careerId, score]) => {
      const career = CAREERS[careerId];
      const fitScore = Math.min(96, Math.round((score / maxPossible) * 100) + 20); // floor bump so early answers still look meaningful
      return {
        id: career.id,
        name: career.name,
        tagline: career.tagline,
        fitScore,
        reasons: [...new Set(reasonHints[careerId])].slice(0, 2),
      };
    });

  profile.careerStatus = "exploring";
  profile.discoveryAnswers = answers;
  save(db);

  res.json({
    recommendations: ranked,
    note: "These are starting suggestions based on your answers, not a prediction — you can explore any of them or pick a different path anytime.",
  });
});

module.exports = router;