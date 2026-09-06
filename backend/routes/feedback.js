const express = require("express");
const { load, save, nextId } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Industry submits feedback for a student after an internship/placement
router.post("/", requireAuth, requireRole("industry"), (req, res) => {
  const { studentUserId, opportunityId, rating, comments } = req.body || {};
  if (!studentUserId || !opportunityId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "studentUserId, opportunityId, and rating (1-5) are required." });
  }

  const db = load();
  const opp = db.opportunities.find((o) => o.id === Number(opportunityId));
  if (!opp || opp.industryUserId !== req.user.id) {
    return res.status(403).json({ error: "You can only give feedback for your own postings." });
  }

  const id = nextId(db, "feedback");
  const entry = {
    id,
    studentUserId: Number(studentUserId),
    opportunityId: Number(opportunityId),
    companyName: opp.companyName,
    rating,
    comments: comments || "",
    createdAt: new Date().toISOString(),
  };
  db.feedback.push(entry);
  save(db);
  res.json({ success: true, feedback: entry });
});

// Student views all feedback they've received
router.get("/mine", requireAuth, requireRole("student"), (req, res) => {
  const db = load();
  const mine = db.feedback.filter((f) => f.studentUserId === req.user.id);
  res.json({ feedback: mine });
});

module.exports = router;
