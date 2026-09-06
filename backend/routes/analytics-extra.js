const express = require("express");
const { load } = require("../db");

const router = express.Router();

// College-level: average skill gap across all students
router.get("/college-skill-gap", (req, res) => {
  const db = load();
  const allRequired = [...new Set(db.opportunities.flatMap((o) => o.requiredSkills || []))];
  const gapCounts = {};
  allRequired.forEach((skill) => (gapCounts[skill] = 0));

  db.studentProfiles.forEach((s) => {
    allRequired.forEach((skill) => {
      if (!(s.skills || []).includes(skill)) gapCounts[skill]++;
    });
  });

  res.json(gapCounts);
});

// Placement funnel counts
router.get("/placement-funnel", (req, res) => {
  const db = load();
  const total = db.applications.length;
  const shortlisted = db.applications.filter((a) => a.status === "shortlisted").length;
  const placed = db.applications.filter((a) => a.status === "placed").length;
  res.json({ total, shortlisted, placed });
});

module.exports = router;