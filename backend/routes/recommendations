const express = require("express");
const { load } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Suggest skills for the logged-in student: skills that are in demand
// across open opportunities but the student doesn't have yet, ranked by
// how many postings need them.
router.get("/me", requireAuth, requireRole("student"), (req, res) => {
  const db = load();
  const profile = db.studentProfiles.find((p) => p.userId === req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found." });

  const mySkills = new Set((profile.skills || []).map((s) => s.skillName));
  const demandCount = new Map();

  db.opportunities
    .filter((o) => o.status === "open")
    .forEach((o) => {
      (o.requiredSkills || []).forEach((s) => {
        if (!mySkills.has(s.skillName)) {
          demandCount.set(s.skillName, (demandCount.get(s.skillName) || 0) + 1);
        }
      });
    });

  const recommendations = Array.from(demandCount.entries())
    .map(([skillName, opportunityCount]) => ({ skillName, opportunityCount }))
    .sort((a, b) => b.opportunityCount - a.opportunityCount)
    .slice(0, 5);

  res.json({ recommendations });
});

module.exports = router;
