const express = require("express");
const { load } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Suggest training topics for a college based on their students' skill gaps
// vs. what open opportunities require.
router.get("/suggestions", requireAuth, requireRole("college"), (req, res) => {
  const db = load();
  const myStudentProfiles = db.studentProfiles.filter((p) => p.collegeUserId === req.user.id);
  const openOpps = db.opportunities.filter((o) => o.status === "open");

  const demand = new Map();
  openOpps.forEach((o) => {
    (o.requiredSkills || []).forEach((s) => {
      demand.set(s.skillName, (demand.get(s.skillName) || 0) + 1);
    });
  });

  const supply = new Map();
  myStudentProfiles.forEach((p) => {
    (p.skills || []).forEach((s) => {
      supply.set(s.skillName, (supply.get(s.skillName) || 0) + 1);
    });
  });

  const suggestions = Array.from(demand.entries())
    .map(([skillName, demandCount]) => {
      const supplyCount = supply.get(skillName) || 0;
      const studentsLacking = myStudentProfiles.length - supplyCount;
      return {
        skillName,
        demandCount,
        studentsWithSkill: supplyCount,
        studentsLacking,
        priority: demandCount * studentsLacking,
      };
    })
    .filter((s) => s.studentsLacking > 0)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);

  res.json({ suggestions });
});

module.exports = router;
