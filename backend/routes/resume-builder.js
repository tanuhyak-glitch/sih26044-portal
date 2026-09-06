const express = require("express");
const { load } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Build a complete profile summary for the logged-in student — pulls
// together skills, certificates, and application history into one view
// that can be displayed as a "digital resume" in the frontend.
router.get("/me", requireAuth, requireRole("student"), (req, res) => {
  const db = load();
  const user = db.users.find((u) => u.id === req.user.id);
  const profile = db.studentProfiles.find((p) => p.userId === req.user.id);
  const certificates = db.certificates.filter((c) => c.studentId === String(req.user.id));
  const applications = db.applications
    .filter((a) => a.studentUserId === req.user.id)
    .map((a) => ({
      ...a,
      opportunity: db.opportunities.find((o) => o.id === a.opportunityId),
    }));
  const feedback = db.feedback.filter((f) => f.studentUserId === req.user.id);

  res.json({
    name: user.name,
    email: user.email,
    branch: profile ? profile.branch : "",
    year: profile ? profile.year : "",
    bio: profile ? profile.bio : "",
    skills: profile ? profile.skills : [],
    certificates,
    applications,
    feedback,
  });
});

module.exports = router;
