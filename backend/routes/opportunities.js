const express = require("express");
const { load, save, nextId } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { computeMatch } = require("../utils/matching");

const router = express.Router();

function shapeOpportunity(opp) {
  return { ...opp };
}

// Browse open opportunities (students and anyone logged in). For students,
// also attach a live match score against their own skill profile so the
// browse list itself demonstrates the matching engine.
router.get("/", requireAuth, (req, res) => {
  const db = load();
  let list = db.opportunities.filter((o) => o.status === "open");

  if (req.user.role === "student") {
    const profile = db.studentProfiles.find((p) => p.userId === req.user.id);
    const studentSkills = profile ? profile.skills : [];
    list = list.map((o) => {
      const { score } = computeMatch(o.requiredSkills, studentSkills);
      return { ...o, matchScore: score };
    });
    list.sort((a, b) => b.matchScore - a.matchScore);
  }

  res.json({ opportunities: list });
});

router.get("/mine", requireAuth, requireRole("industry"), (req, res) => {
  const db = load();
  const list = db.opportunities.filter((o) => o.industryUserId === req.user.id);
  res.json({ opportunities: list });
});

router.get("/:id", requireAuth, (req, res) => {
  const db = load();
  const opp = db.opportunities.find((o) => o.id === Number(req.params.id));
  if (!opp) return res.status(404).json({ error: "Opportunity not found." });

  if (req.user.role === "student") {
    const profile = db.studentProfiles.find((p) => p.userId === req.user.id);
    const { score, breakdown, gaps } = computeMatch(opp.requiredSkills, profile ? profile.skills : []);
    return res.json({ opportunity: opp, match: { score, breakdown, gaps } });
  }
  res.json({ opportunity: opp });
});

router.post("/", requireAuth, requireRole("industry"), (req, res) => {
  const { title, type, description, location, stipend, seats, requiredSkills } = req.body || {};
  if (!title || !type || !requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
    return res.status(400).json({ error: "Title, type and at least one required skill are needed." });
  }
  for (const s of requiredSkills) {
    if (!s.skillName || typeof s.level !== "number" || s.level < 1 || s.level > 5) {
      return res.status(400).json({ error: "Each required skill needs a skillName and level from 1 to 5." });
    }
  }

  const db = load();
  const id = nextId(db, "opportunities");
  const opp = {
    id,
    industryUserId: req.user.id,
    companyName: req.user.orgName || req.user.name,
    title: title.trim(),
    type,
    description: description || "",
    location: location || "",
    stipend: stipend || "",
    seats: seats || 1,
    status: "open",
    requiredSkills: requiredSkills.map((s) => ({ skillName: s.skillName.trim(), level: s.level })),
    createdAt: new Date().toISOString(),
  };
  db.opportunities.push(opp);
  save(db);
  res.status(201).json({ opportunity: opp });
});

router.put("/:id", requireAuth, requireRole("industry"), (req, res) => {
  const db = load();
  const opp = db.opportunities.find((o) => o.id === Number(req.params.id));
  if (!opp) return res.status(404).json({ error: "Opportunity not found." });
  if (opp.industryUserId !== req.user.id) {
    return res.status(403).json({ error: "You can only edit your own postings." });
  }
  const { status, title, description, location, stipend, seats, requiredSkills } = req.body || {};
  if (status) opp.status = status;
  if (title) opp.title = title;
  if (description !== undefined) opp.description = description;
  if (location !== undefined) opp.location = location;
  if (stipend !== undefined) opp.stipend = stipend;
  if (seats !== undefined) opp.seats = seats;
  if (requiredSkills) opp.requiredSkills = requiredSkills;
  save(db);
  res.json({ opportunity: opp });
});

module.exports = router;
