const express = require("express");
const { load, save } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const CAREER_STATUSES = ["known", "exploring", "unsure"];

function findProfile(db, userId) {
  return db.studentProfiles.find((p) => p.userId === userId);
}

function shapeOnboarding(db, userId) {
  const user = db.users.find((u) => u.id === userId);
  const profile = findProfile(db, userId);
  if (!user || !profile) return null;
  return {
    name: user.name,
    email: user.email,
    collegeUserId: profile.collegeUserId,
    branch: profile.branch,
    year: profile.year,
    degree: profile.degree,
    semester: profile.semester,
    bio: profile.bio,
    skills: profile.skills,
    completedCourses: profile.completedCourses || [],
    projects: profile.projects || [],
    internships: profile.internships || [],
    interests: profile.interests || [],
    careerStatus: profile.careerStatus,
    githubUrl: profile.githubUrl || "",
    linkedinUrl: profile.linkedinUrl || "",
    onboardingComplete: Boolean(profile.onboardingComplete),
  };
}

// Current onboarding state — the frontend uses this to decide whether to
// show the onboarding wizard right after login.
router.get("/me", requireAuth, requireRole("student"), (req, res) => {
  const db = load();
  const shaped = shapeOnboarding(db, req.user.id);
  if (!shaped) return res.status(404).json({ error: "Profile not found." });
  res.json({ onboarding: shaped });
});

// Save onboarding answers. Can be called multiple times as the student
// moves through the wizard; pass complete: true on the final step to mark
// onboarding as finished.
router.put("/me", requireAuth, requireRole("student"), (req, res) => {
  const {
    degree, branch, year, semester, completedCourses,
    skills, projects, internships, interests,
    careerStatus, githubUrl, linkedinUrl, bio, collegeId, complete,
  } = req.body || {};

  if (careerStatus !== undefined && careerStatus !== null && !CAREER_STATUSES.includes(careerStatus)) {
    return res.status(400).json({ error: `careerStatus must be one of: ${CAREER_STATUSES.join(", ")}` });
  }

  const db = load();
  const profile = findProfile(db, req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found." });

  if (degree !== undefined) profile.degree = degree;
  if (branch !== undefined) profile.branch = branch;
  if (year !== undefined) profile.year = year;
  if (semester !== undefined) profile.semester = semester;
  if (bio !== undefined) profile.bio = bio;
  if (githubUrl !== undefined) profile.githubUrl = githubUrl;
  if (linkedinUrl !== undefined) profile.linkedinUrl = linkedinUrl;
  if (careerStatus !== undefined) profile.careerStatus = careerStatus;
  if (Array.isArray(completedCourses)) profile.completedCourses = completedCourses;
  if (Array.isArray(interests)) profile.interests = interests;
  if (Array.isArray(projects)) profile.projects = projects;
  if (Array.isArray(internships)) profile.internships = internships;
  if (Array.isArray(skills)) {
    for (const s of skills) {
      if (!s.skillName || typeof s.level !== "number" || s.level < 1 || s.level > 5) {
        return res.status(400).json({ error: "Each skill needs a skillName and a level from 1 to 5." });
      }
    }
    profile.skills = skills.map((s) => ({ skillName: s.skillName.trim(), level: s.level }));
  }
  if (collegeId !== undefined) {
    const college = collegeId ? db.users.find((u) => u.id === Number(collegeId) && u.role === "college") : null;
    profile.collegeUserId = college ? college.id : null;
  }
  if (complete === true) profile.onboardingComplete = true;

  save(db);
  res.json({ onboarding: shapeOnboarding(db, req.user.id) });
});

module.exports = router;
