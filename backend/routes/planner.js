const express = require("express");
const { load, save } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const CAREER_CATALOG = require("../data/careerCatalog");

const router = express.Router();
const DAY_ORDER = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const DAY_LABEL = { MO: "Monday", TU: "Tuesday", WE: "Wednesday", TH: "Thursday", FR: "Friday", SA: "Saturday", SU: "Sunday" };

function findProfile(db, userId) {
  return db.studentProfiles.find((p) => p.userId === userId);
}

function studentLevel(profile, skillName) {
  const match = (profile.skills || []).find((s) => s.skillName.toLowerCase() === skillName.toLowerCase());
  return match ? match.level : 0;
}

// Which roadmap skills still need work, in roadmap order, for the
// student's chosen career.
function pendingSkills(profile) {
  const career = CAREER_CATALOG.find((c) => c.key === profile.careerGoal);
  if (!career) return [];
  return career.roadmap
    .map((step) => ({ ...step, currentLevel: studentLevel(profile, step.skillName) }))
    .filter((step) => step.currentLevel < step.minLevel);
}

function slotMinutes(slot) {
  const [sh, sm] = slot.start.split(":").map(Number);
  const [eh, em] = slot.end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

// Builds a realistic weekly plan: each declared free slot gets exactly one
// task, cycling through the still-pending roadmap skills so nothing is
// crammed into a single day. This is a simple, explainable scheduler over
// the free time the student already told us about — it does not read a
// real college timetable, since none is connected in this build.
function buildPlan(profile) {
  const slots = [...(profile.freeTimeSlots || [])].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.start.localeCompare(b.start)
  );
  const pending = pendingSkills(profile);

  if (slots.length === 0) {
    return { tasks: [], note: "Add your free-time slots below to get a weekly plan." };
  }
  if (pending.length === 0) {
    if (!profile.careerGoal) {
      return { tasks: [], note: "Choose a career goal on the Career & Roadmap tab first — the plan is built from your roadmap's next steps." };
    }
    return {
      tasks: slots.map((slot) => ({
        day: slot.day,
        dayLabel: DAY_LABEL[slot.day],
        start: slot.start,
        end: slot.end,
        task: "Work on your portfolio project (see AI Project Mentor) — every roadmap skill is already at target level.",
        skillName: null,
      })),
      note: "You've reached target level on every roadmap skill — time to build evidence with a project.",
    };
  }

  const tasks = slots.map((slot, i) => {
    const skill = pending[i % pending.length];
    const minutes = slotMinutes(slot);
    return {
      day: slot.day,
      dayLabel: DAY_LABEL[slot.day],
      start: slot.start,
      end: slot.end,
      skillName: skill.skillName,
      task: `Work on "${skill.skillName}" (currently L${skill.currentLevel}, target L${skill.minLevel}) — ${minutes} min: a short tutorial or hands-on exercise.`,
    };
  });

  return {
    tasks,
    note: "Academic classes, exams, and personal time are assumed already blocked out — only the free time you declared below is scheduled.",
  };
}

router.get("/me", requireAuth, requireRole("student"), (req, res) => {
  const db = load();
  const profile = findProfile(db, req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found." });

  res.json({
    freeTimeSlots: profile.freeTimeSlots || [],
    plan: buildPlan(profile),
  });
});

router.put("/me/slots", requireAuth, requireRole("student"), (req, res) => {
  const { slots } = req.body || {};
  if (!Array.isArray(slots)) return res.status(400).json({ error: "slots must be an array." });

  for (const s of slots) {
    if (!DAY_ORDER.includes(s.day) || !/^\d{2}:\d{2}$/.test(s.start) || !/^\d{2}:\d{2}$/.test(s.end)) {
      return res.status(400).json({ error: "Each slot needs a valid day, start, and end (HH:MM)." });
    }
    if (slotMinutes(s) <= 0) {
      return res.status(400).json({ error: "Each slot's end time must be after its start time." });
    }
  }

  const db = load();
  const profile = findProfile(db, req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found." });

  profile.freeTimeSlots = slots;
  save(db);

  res.json({ freeTimeSlots: profile.freeTimeSlots, plan: buildPlan(profile) });
});

module.exports = router;
