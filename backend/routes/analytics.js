const express = require("express");
const { load } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { computeMatch } = require("../utils/matching");

const router = express.Router();

function buildSkillHeatmap(profiles) {
  const map = new Map(); // skillName -> { total, count }
  profiles.forEach((p) => {
    (p.skills || []).forEach((s) => {
      const entry = map.get(s.skillName) || { total: 0, count: 0 };
      entry.total += s.level;
      entry.count += 1;
      map.set(s.skillName, entry);
    });
  });
  return Array.from(map.entries())
    .map(([skillName, { total, count }]) => ({
      skillName,
      studentsWithSkill: count,
      averageLevel: Math.round((total / count) * 10) / 10,
    }))
    .sort((a, b) => b.studentsWithSkill - a.studentsWithSkill);
}

function buildDemandVsSupply(opportunities, profiles) {
  const demand = new Map(); // skillName -> count of postings requiring it
  opportunities.forEach((o) => {
    (o.requiredSkills || []).forEach((s) => {
      demand.set(s.skillName, (demand.get(s.skillName) || 0) + 1);
    });
  });
  const supply = new Map();
  profiles.forEach((p) => {
    (p.skills || []).forEach((s) => {
      supply.set(s.skillName, (supply.get(s.skillName) || 0) + 1);
    });
  });
  return Array.from(demand.entries())
    .map(([skillName, demandCount]) => ({
      skillName,
      demandCount,
      supplyCount: supply.get(skillName) || 0,
      gap: demandCount - (supply.get(skillName) || 0),
    }))
    .sort((a, b) => b.gap - a.gap);
}

router.get("/college", requireAuth, requireRole("college"), (req, res) => {
  const db = load();
  const myStudentProfiles = db.studentProfiles.filter((p) => p.collegeUserId === req.user.id);
  const myStudentIds = new Set(myStudentProfiles.map((p) => p.userId));

  const myApplications = db.applications.filter((a) => myStudentIds.has(a.studentUserId));
  const placed = myApplications.filter((a) => a.status === "selected").length;
  const shortlisted = myApplications.filter((a) => a.status === "shortlisted").length;

  const heatmap = buildSkillHeatmap(myStudentProfiles);
  const demandVsSupply = buildDemandVsSupply(
    db.opportunities.filter((o) => o.status === "open"),
    myStudentProfiles
  );

  res.json({
    totals: {
      students: myStudentProfiles.length,
      applications: myApplications.length,
      shortlisted,
      placed,
      placementRate: myStudentProfiles.length
        ? Math.round((placed / myStudentProfiles.length) * 100)
        : 0,
    },
    skillHeatmap: heatmap,
    demandVsSupply,
  });
});

router.get("/admin", requireAuth, requireRole("admin"), (req, res) => {
  const db = load();
  const students = db.users.filter((u) => u.role === "student");
  const industries = db.users.filter((u) => u.role === "industry");
  const colleges = db.users.filter((u) => u.role === "college");
  const openOpportunities = db.opportunities.filter((o) => o.status === "open");
  const placed = db.applications.filter((a) => a.status === "selected").length;

  const heatmap = buildSkillHeatmap(db.studentProfiles);
  const demandVsSupply = buildDemandVsSupply(openOpportunities, db.studentProfiles);

  const applicationsByStatus = ["applied", "shortlisted", "selected", "rejected"].map((status) => ({
    status,
    count: db.applications.filter((a) => a.status === status).length,
  }));

  res.json({
    totals: {
      students: students.length,
      industries: industries.length,
      colleges: colleges.length,
      openOpportunities: openOpportunities.length,
      totalApplications: db.applications.length,
      placed,
    },
    skillHeatmap: heatmap,
    demandVsSupply,
    applicationsByStatus,
  });
});

module.exports = router;
