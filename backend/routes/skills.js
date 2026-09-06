const express = require("express");
const { load, save, nextId } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Default taxonomy — seeded once if empty
const DEFAULT_SKILLS = [
  "C Programming", "C++", "Java", "Python", "JavaScript",
  "Data Structures", "Algorithms", "SQL", "React", "Node.js",
  "Machine Learning", "Communication", "Teamwork", "Problem Solving",
  "Git", "HTML/CSS", "REST APIs", "Cloud Basics",
];

// Get full skill list (auto-seed if empty) — anyone logged in can view
router.get("/", requireAuth, (req, res) => {
  const db = load();
  if (db.skills.length === 0) {
    db.skills = DEFAULT_SKILLS.map((name) => ({
      id: nextId(db, "skills"),
      name,
      category: "General",
    }));
    save(db);
  }
  res.json(db.skills);
});

// Add a new skill — only admin/college can extend the taxonomy
router.post("/", requireAuth, requireRole("admin"), (req, res) => {
  const { name, category } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });

  const db = load();
  const exists = db.skills.find((s) => s.name.toLowerCase() === name.toLowerCase());
  if (exists) return res.status(400).json({ error: "Skill already exists" });

  const skill = { id: nextId(db, "skills"), name, category: category || "General" };
  db.skills.push(skill);
  save(db);
  res.json({ success: true, skill });
});

module.exports = router;