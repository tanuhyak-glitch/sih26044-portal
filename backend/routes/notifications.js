const express = require("express");
const { load, save } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", requireAuth, (req, res) => {
  const db = load();
  const mine = db.notifications
    .filter((n) => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ notifications: mine });
});

router.put("/:id/read", requireAuth, (req, res) => {
  const db = load();
  const note = db.notifications.find((n) => n.id === Number(req.params.id) && n.userId === req.user.id);
  if (!note) return res.status(404).json({ error: "Notification not found." });
  note.read = true;
  save(db);
  res.json({ notification: note });
});

router.put("/read-all", requireAuth, (req, res) => {
  const db = load();
  db.notifications.forEach((n) => {
    if (n.userId === req.user.id) n.read = true;
  });
  save(db);
  res.json({ ok: true });
});

module.exports = router;
