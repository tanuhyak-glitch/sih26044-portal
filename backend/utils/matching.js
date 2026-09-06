// utils/matching.js
// Core "AI-style" skill-matching engine. It's a transparent, explainable
// weighted algorithm rather than a black-box model — deliberately, since a
// judge can ask "how did you get 82%?" and get a straight answer, which
// matters more in a hackathon demo than an opaque ML score.
//
// For each required skill on an opportunity:
//   - full credit if the student's level meets or exceeds the requirement
//   - partial credit proportional to how close they are, if below
//   - a missing skill scores 0 and is reported as a gap
// The overall score is the average across all required skills, so having
// more required skills does not unfairly punish otherwise strong matches.

function computeMatch(requiredSkills, studentSkills) {
  const studentSkillMap = new Map(
    (studentSkills || []).map((s) => [normalise(s.skillName), s.level])
  );

  if (!requiredSkills || requiredSkills.length === 0) {
    return { score: 0, breakdown: [], gaps: [] };
  }

  const breakdown = requiredSkills.map((req) => {
    const studentLevel = studentSkillMap.get(normalise(req.skillName)) || 0;
    const ratio = Math.min(studentLevel / req.level, 1);
    return {
      skillName: req.skillName,
      required: req.level,
      studentLevel,
      met: studentLevel >= req.level,
      contribution: Math.round(ratio * 100),
    };
  });

  const score = Math.round(
    breakdown.reduce((sum, b) => sum + b.contribution, 0) / breakdown.length
  );

  const gaps = breakdown
    .filter((b) => !b.met)
    .map((b) => ({
      skillName: b.skillName,
      requiredLevel: b.required,
      currentLevel: b.studentLevel,
      levelsToClose: b.required - b.studentLevel,
    }));

  return { score, breakdown, gaps };
}

function normalise(name) {
  return String(name || "").trim().toLowerCase();
}

module.exports = { computeMatch };
