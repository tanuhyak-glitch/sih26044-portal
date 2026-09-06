const express = require("express");
const { load, save } = require("../db");

const router = express.Router();

function computeMatch(studentSkills, requiredSkills) {
  const matched = requiredSkills.filter((s) => studentSkills.includes(s));
  const gap = requiredSkills.filter((s) => !studentSkills.includes(s));
  const score = requiredSkills.length
    ? Math.round((matched.length / requiredSkills.length) * 100)
    : 0;
  return { score, matched, gap };
}

// Match a student against one opportunity
router.get("/score/:studentId/:opportunityId", (req, res) => {
  const db = load();
  const student = db.studentProfiles.find((s) => s.studentId === req.params.studentId);
  const opp = db.opportunities.find((o) => String(o.id) === req.params.opportunityId);
  if (!student || !opp) return res.status(404).json({ error: "Not found" });

  const result = computeMatch(student.skills || [], opp.requiredSkills || []);
  res.json({ studentId: student.studentId, opportunityId: opp.id, ...result });
});

// Rank all students for a given opportunity (industry view)
router.get("/rank/:opportunityId", (req, res) => {
  const db = load();
  const opp = db.opportunities.find((o) => String(o.id) === req.params.opportunityId);
  if (!opp) return res.status(404).json({ error: "Opportunity not found" });

  const ranked = db.studentProfiles
    .map((s) => ({
      studentId: s.studentId,
      name: s.name,
      ...computeMatch(s.skills || [], opp.requiredSkills || []),
    }))
    .sort((a, b) => b.score - a.score);

  res.json(ranked);
});

// Skill gap for one student across ALL opportunities (student dashboard)
router.get("/gap/:studentId", (req, res) => {
  const db = load();
  const student = db.studentProfiles.find((s) => s.studentId === req.params.studentId);
  if (!student) return res.status(404).json({ error: "Student not found" });

  const allRequired = [...new Set(db.opportunities.flatMap((o) => o.requiredSkills || []))];
  const gap = allRequired.filter((s) => !(student.skills || []).includes(s));
  res.json({ studentId: student.studentId, currentSkills: student.skills || [], gap });
});

module.exports = router;