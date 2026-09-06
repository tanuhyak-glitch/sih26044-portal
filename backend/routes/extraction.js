const express = require("express");
const { load } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function extractSkills(text, skillsMaster) {
  const lowerText = text.toLowerCase();
  return skillsMaster.filter((skill) => lowerText.includes(skill.toLowerCase()));
}

// Paste resume text -> get back matched skills from the master taxonomy
router.post("/resume", requireAuth, (req, res) => {
  const { resumeText } = req.body || {};
  if (!resumeText || typeof resumeText !== "string") {
    return res.status(400).json({ error: "resumeText is required." });
  }

  const db = load();
  const foundSkills = extractSkills(resumeText, db.skillsMaster);
  res.json({ foundSkills });
});

// Paste a job description -> get back required skills (for industry postings)
router.post("/job-description", requireAuth, (req, res) => {
  const { jobText } = req.body || {};
  if (!jobText || typeof jobText !== "string") {
    return res.status(400).json({ error: "jobText is required." });
  }

  const db = load();
  const foundSkills = extractSkills(jobText, db.skillsMaster);
  res.json({ foundSkills });
});

module.exports = router;
