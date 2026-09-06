const express = require("express");
const { load, save } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

function findProfile(db, userId) {
  return db.studentProfiles.find((p) => p.userId === userId);
}

function shapeStudent(db, userId) {
  const user = db.users.find((u) => u.id === userId);
  const profile = findProfile(db, userId);
  if (!user || !profile) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    branch: profile.branch,
    year: profile.year,
    degree: profile.degree || "",
    semester: profile.semester || "",
    bio: profile.bio,
    skills: profile.skills,
    careerStatus: profile.careerStatus || null,
    githubUrl: profile.githubUrl || "",
    linkedinUrl: profile.linkedinUrl || "",
    onboardingComplete: Boolean(profile.onboardingComplete),
  };
}

// Current student's own profile
router.get("/me", requireAuth, requireRole("student"), (req, res) => {
  const db = load();
  const shaped = shapeStudent(db, req.user.id);
  if (!shaped) return res.status(404).json({ error: "Profile not found." });
  res.json({ profile: shaped });
});

router.put("/me", requireAuth, requireRole("student"), (req, res) => {
  const { branch, year, bio } = req.body || {};
  const db = load();
  const profile = findProfile(db, req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found." });
  if (branch !== undefined) profile.branch = branch;
  if (year !== undefined) profile.year = year;
  if (bio !== undefined) profile.bio = bio;
  save(db);
  res.json({ profile: shapeStudent(db, req.user.id) });
});

// Replace the full skill list for the logged-in student.
// Body: { skills: [{ skillName, level (1-5) }] }
router.put("/me/skills", requireAuth, requireRole("student"), (req, res) => {
  const { skills } = req.body || {};
  if (!Array.isArray(skills)) {
    return res.status(400).json({ error: "skills must be an array." });
  }
  for (const s of skills) {
    if (!s.skillName || typeof s.level !== "number" || s.level < 1 || s.level > 5) {
      return res.status(400).json({ error: "Each skill needs a skillName and a level from 1 to 5." });
    }
  }
  const db = load();
  const profile = findProfile(db, req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found." });
  profile.skills = skills.map((s) => ({ skillName: s.skillName.trim(), level: s.level }));
  save(db);
  res.json({ profile: shapeStudent(db, req.user.id) });
});

// Roster view for college / admin. A college TPO only ever sees students
// linked to their own college; admin sees everyone across the platform.
router.get("/", requireAuth, requireRole("college", "admin"), (req, res) => {
  const db = load();
  let profiles = db.studentProfiles;
  if (req.user.role === "college") {
    profiles = profiles.filter((p) => p.collegeUserId === req.user.id);
  }
  const students = profiles.map((p) => shapeStudent(db, p.userId)).filter(Boolean);
  res.json({ students });
});

router.get("/skills-master", requireAuth, (req, res) => {
  const db = load();
  res.json({ skills: db.skillsMaster });
});

module.exports = router;
