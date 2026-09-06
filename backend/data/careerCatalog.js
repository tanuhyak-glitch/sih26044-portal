// data/careerCatalog.js
// A small, curated set of career tracks. Each roadmap step names a skill
// and the minimum level (1-5) considered "ready" for that step. This is
// rule-based (no external AI/LLM call — none is configured in this
// project), but it is what powers the personalised roadmap, skill-gap,
// and readiness-score features.

module.exports = [
  {
    key: "software-development",
    label: "Software Development",
    description: "Design and build applications, APIs, and systems software.",
    roadmap: [
      { skillName: "Programming Fundamentals", minLevel: 3 },
      { skillName: "Git & GitHub", minLevel: 2 },
      { skillName: "Data Structures & Algorithms", minLevel: 3 },
      { skillName: "Web Development", minLevel: 3 },
      { skillName: "Backend Development", minLevel: 3 },
      { skillName: "Database Management", minLevel: 3 },
      { skillName: "Project Portfolio", minLevel: 2 },
    ],
  },
  {
    key: "data-analytics",
    label: "Data Analytics",
    description: "Turn raw data into decisions using statistics and visualization.",
    roadmap: [
      { skillName: "Excel & Statistics", minLevel: 3 },
      { skillName: "SQL", minLevel: 3 },
      { skillName: "Python", minLevel: 3 },
      { skillName: "Data Visualization", minLevel: 3 },
      { skillName: "Data Modeling", minLevel: 2 },
      { skillName: "Project Portfolio", minLevel: 2 },
    ],
  },
  {
    key: "cybersecurity",
    label: "Cybersecurity",
    description: "Protect systems, networks, and data from attackers.",
    roadmap: [
      { skillName: "Networking", minLevel: 3 },
      { skillName: "Linux", minLevel: 3 },
      { skillName: "Security Fundamentals", minLevel: 3 },
      { skillName: "Cloud Security", minLevel: 2 },
      { skillName: "Security Projects", minLevel: 2 },
    ],
  },
  {
    key: "ui-ux-design",
    label: "UI/UX Design",
    description: "Design usable, delightful digital products.",
    roadmap: [
      { skillName: "Design Fundamentals", minLevel: 3 },
      { skillName: "Wireframing", minLevel: 3 },
      { skillName: "Figma", minLevel: 3 },
      { skillName: "User Research", minLevel: 2 },
      { skillName: "Portfolio Case Studies", minLevel: 2 },
    ],
  },
];
