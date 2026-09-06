const express = require("express");
const { load } = require("../db");

const router = express.Router();

router.get("/colleges", (req, res) => {
  const db = load();
  const colleges = db.users
    .filter((u) => u.role === "college")
    .map((u) => ({ id: u.id, name: u.orgName || u.name }));
  res.json({ colleges });
});

module.exports = router;
