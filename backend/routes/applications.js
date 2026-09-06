const express = require("express");
const { load, save, nextId } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { computeMatch } = require("../utils/matching");

const router = express.Router();

function addNotification(db, userId, message) {
  const id = nextId(db, "notifications");
  db.notifications.push({
    id, userId, message, read: false, createdAt: new Date().toISOString(),
  });
}

// Student applies to an opportunity
router.post("/", requireAuth, requireRole("student"), (req, res) => {
  const { opportunityId } = req.body || {};
  const db = load();
  const opp = db.opportunities.find((o) => o.id === Number(opportunityId));
  if (!opp) return res.status(404).json({ error: "Opportunity not found." });
  if (opp.status !== "open") return res.status(400).json({ error: "This opportunity is no longer open." });

  const already = db.applications.find(
    (a) => a.opportunityId === opp.id && a.studentUserId === req.user.id
  );
  if (already) return res.status(409).json({ error: "You've already applied to this opportunity." });

  const profile = db.studentProfiles.find((p) => p.userId === req.user.id);
  const { score } = computeMatch(opp.requiredSkills, profile ? profile.skills : []);

  const id = nextId(db, "applications");
  const application = {
    id, opportunityId: opp.id, studentUserId: req.user.id,
    matchScore: score, status: "applied", appliedAt: new Date().toISOString(),
  };
  db.applications.push(application);
  addNotification(db, opp.industryUserId, `${req.user.name} applied to "${opp.title}" (${score}% skill match).`);
  save(db);
  res.status(201).json({ application });
});

// Student's own applications, with opportunity details attached
router.get("/mine", requireAuth, requireRole("student"), (req, res) => {
  const db = load();
  const mine = db.applications
    .filter((a) => a.studentUserId === req.user.id)
    .map((a) => ({ ...a, opportunity: db.opportunities.find((o) => o.id === a.opportunityId) }));
  res.json({ applications: mine });
});

// Industry views ranked applicants for one of its own opportunities
router.get("/opportunity/:opportunityId", requireAuth, requireRole("industry"), (req, res) => {
  const db = load();
  const opp = db.opportunities.find((o) => o.id === Number(req.params.opportunityId));
  if (!opp) return res.status(404).json({ error: "Opportunity not found." });
  if (opp.industryUserId !== req.user.id) {
    return res.status(403).json({ error: "You can only view applicants for your own postings." });
  }

  const apps = db.applications
    .filter((a) => a.opportunityId === opp.id)
    .map((a) => {
      const student = db.users.find((u) => u.id === a.studentUserId);
      const profile = db.studentProfiles.find((p) => p.userId === a.studentUserId);
      const { breakdown, gaps } = computeMatch(opp.requiredSkills, profile ? profile.skills : []);
      return {
        ...a,
        studentName: student ? student.name : "Unknown",
        studentEmail: student ? student.email : "",
        branch: profile ? profile.branch : "",
        year: profile ? profile.year : "",
        breakdown,
        gaps,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  res.json({ opportunity: opp, applicants: apps });
});

router.put("/:id/status", requireAuth, requireRole("industry"), (req, res) => {
  const { status } = req.body || {};
  const valid = ["applied", "shortlisted", "selected", "rejected"];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${valid.join(", ")}` });
  }
  const db = load();
  const app = db.applications.find((a) => a.id === Number(req.params.id));
  if (!app) return res.status(404).json({ error: "Application not found." });
  const opp = db.opportunities.find((o) => o.id === app.opportunityId);
  if (!opp || opp.industryUserId !== req.user.id) {
    return res.status(403).json({ error: "You can only update applicants for your own postings." });
  }
  app.status = status;
  const label = { shortlisted: "shortlisted", selected: "selected", rejected: "not selected", applied: "received" }[status];
  addNotification(db, app.studentUserId, `Your application for "${opp.title}" at ${opp.companyName} was ${label}.`);
  save(db);
  res.json({ application: app });
});

module.exports = router;
