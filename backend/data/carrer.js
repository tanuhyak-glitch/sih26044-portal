// careers.js
// Static career catalog, grouped by degree category so a B.Tech student sees
// different options than a B.Com or B.Pharm student. Each career has a flat
// list of coreSkills (used to compute "what you have vs what's missing")
// and a staged roadmap (used for the visual start->end journey).

function degreeCategory(degree) {
  const d = (degree || "").toLowerCase();
  if (d.includes("pharm")) return "pharma";
  if (d.includes("com") || d.includes("bba")) return "business";
  if (d === "ba" || d.startsWith("ba ") || d.includes("(ba)")) return "humanities";
  return "tech"; // B.Tech/B.E., BCA, B.Sc, and "Other" default here
}

const CAREERS = {
  // ---------------------------------------------------------------- tech --
  "software-development": {
    id: "software-development",
    name: "Software Development",
    tagline: "Build the applications people use every day.",
    category: "tech",
    coreSkills: ["Programming Fundamentals", "Git & GitHub", "Data Structures & Algorithms", "OOP", "HTML/CSS/JS", "Frontend Framework (React)", "Backend (Node/Express)", "SQL Databases"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Programming Fundamentals", "Git & GitHub"] },
      { stage: 2, title: "Core Computer Science", items: ["Data Structures & Algorithms", "OOP"] },
      { stage: 3, title: "Web Development", items: ["HTML/CSS/JS", "Frontend Framework (React)"] },
      { stage: 4, title: "Backend & Database", items: ["Backend (Node/Express)", "SQL Databases"] },
      { stage: 5, title: "Build & Prove", items: ["Personal Projects", "Open Source Contribution"] },
      { stage: 6, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },
  "data-analytics": {
    id: "data-analytics",
    name: "Data Analytics",
    tagline: "Turn raw data into decisions.",
    category: "tech",
    coreSkills: ["Excel/Spreadsheets", "SQL Databases", "Python for Data", "Statistics", "Data Visualization", "Business Communication"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Excel/Spreadsheets", "Statistics"] },
      { stage: 2, title: "Querying Data", items: ["SQL Databases"] },
      { stage: 3, title: "Analysis Tools", items: ["Python for Data", "Data Visualization"] },
      { stage: 4, title: "Communicating Insights", items: ["Business Communication"] },
      { stage: 5, title: "Build & Prove", items: ["Analytics Projects", "Dashboards Portfolio"] },
      { stage: 6, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },
  "cybersecurity": {
    id: "cybersecurity",
    name: "Cybersecurity",
    tagline: "Find the weaknesses before attackers do.",
    category: "tech",
    coreSkills: ["Networking Basics", "Linux", "Programming Fundamentals", "Security Fundamentals", "Web Security", "Ethical Hacking Basics"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Networking Basics", "Linux"] },
      { stage: 2, title: "Core Concepts", items: ["Programming Fundamentals", "Security Fundamentals"] },
      { stage: 3, title: "Applied Security", items: ["Web Security", "Ethical Hacking Basics"] },
      { stage: 4, title: "Practice", items: ["CTFs", "Vulnerability Labs"] },
      { stage: 5, title: "Build & Prove", items: ["Security Projects", "Bug Bounty / Writeups"] },
      { stage: 6, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },
  "ui-ux-design": {
    id: "ui-ux-design",
    name: "UI/UX Design",
    tagline: "Design experiences people enjoy using.",
    category: "tech",
    coreSkills: ["Design Fundamentals", "Figma", "User Research", "Wireframing", "Prototyping", "Design Systems"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Design Fundamentals", "Figma"] },
      { stage: 2, title: "Understanding Users", items: ["User Research"] },
      { stage: 3, title: "Designing", items: ["Wireframing", "Prototyping"] },
      { stage: 4, title: "Scaling Design", items: ["Design Systems"] },
      { stage: 5, title: "Build & Prove", items: ["Case Studies", "Portfolio"] },
      { stage: 6, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },
  "cloud-devops": {
    id: "cloud-devops",
    name: "Cloud & DevOps",
    tagline: "Keep applications running, scaling, and shipping.",
    category: "tech",
    coreSkills: ["Linux", "Networking Basics", "Cloud Platform (AWS/Azure/GCP)", "Docker", "CI/CD", "Scripting"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Linux", "Networking Basics"] },
      { stage: 2, title: "Cloud Basics", items: ["Cloud Platform (AWS/Azure/GCP)"] },
      { stage: 3, title: "Containers & Pipelines", items: ["Docker", "CI/CD"] },
      { stage: 4, title: "Automation", items: ["Scripting"] },
      { stage: 5, title: "Build & Prove", items: ["Deployment Projects", "Infra Portfolio"] },
      { stage: 6, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },
  "qa-testing": {
    id: "qa-testing",
    name: "Software Testing / QA",
    tagline: "Make sure it actually works before users find out it doesn't.",
    category: "tech",
    coreSkills: ["Programming Fundamentals", "Manual Testing", "Test Case Design", "Automation Testing", "SQL Databases", "Bug Tracking"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Programming Fundamentals", "Manual Testing"] },
      { stage: 2, title: "Test Design", items: ["Test Case Design", "Bug Tracking"] },
      { stage: 3, title: "Automation", items: ["Automation Testing"] },
      { stage: 4, title: "Data Checks", items: ["SQL Databases"] },
      { stage: 5, title: "Build & Prove", items: ["Testing Projects", "Automation Portfolio"] },
      { stage: 6, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },

  // ------------------------------------------------------------ business --
  "business-analytics": {
    id: "business-analytics",
    name: "Business Analytics",
    tagline: "Use data to guide business decisions.",
    category: "business",
    coreSkills: ["Excel/Spreadsheets", "Statistics", "SQL Databases", "Data Visualization", "Business Communication"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Excel/Spreadsheets", "Statistics"] },
      { stage: 2, title: "Working with Data", items: ["SQL Databases"] },
      { stage: 3, title: "Presenting Insights", items: ["Data Visualization", "Business Communication"] },
      { stage: 4, title: "Build & Prove", items: ["Case Study Projects"] },
      { stage: 5, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },
  "digital-marketing": {
    id: "digital-marketing",
    name: "Digital Marketing",
    tagline: "Get the right message to the right audience.",
    category: "business",
    coreSkills: ["Content Writing", "SEO Basics", "Social Media Strategy", "Analytics Tools", "Campaign Planning"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Content Writing", "SEO Basics"] },
      { stage: 2, title: "Channels", items: ["Social Media Strategy"] },
      { stage: 3, title: "Measuring Impact", items: ["Analytics Tools"] },
      { stage: 4, title: "Build & Prove", items: ["Campaign Planning", "Portfolio Campaigns"] },
      { stage: 5, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },
  "financial-analysis": {
    id: "financial-analysis",
    name: "Financial Analysis",
    tagline: "Understand what the numbers really mean.",
    category: "business",
    coreSkills: ["Accounting Basics", "Excel/Spreadsheets", "Financial Modeling", "Statistics", "Business Communication"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Accounting Basics", "Excel/Spreadsheets"] },
      { stage: 2, title: "Analysis", items: ["Financial Modeling", "Statistics"] },
      { stage: 3, title: "Communicating Findings", items: ["Business Communication"] },
      { stage: 4, title: "Build & Prove", items: ["Financial Model Projects"] },
      { stage: 5, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },
  "hr-analytics": {
    id: "hr-analytics",
    name: "HR & People Analytics",
    tagline: "Help organizations understand and support their people.",
    category: "business",
    coreSkills: ["HR Fundamentals", "Excel/Spreadsheets", "Communication Skills", "Data Interpretation", "Employee Engagement Basics"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["HR Fundamentals", "Communication Skills"] },
      { stage: 2, title: "Working with Data", items: ["Excel/Spreadsheets", "Data Interpretation"] },
      { stage: 3, title: "Applying It", items: ["Employee Engagement Basics"] },
      { stage: 4, title: "Build & Prove", items: ["HR Case Studies"] },
      { stage: 5, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },

  // --------------------------------------------------------- humanities --
  "content-strategy": {
    id: "content-strategy",
    name: "Content Strategy & Writing",
    tagline: "Shape how brands and ideas communicate.",
    category: "humanities",
    coreSkills: ["Writing Fundamentals", "Research Skills", "SEO Basics", "Content Planning", "Editing"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Writing Fundamentals", "Research Skills"] },
      { stage: 2, title: "Reaching an Audience", items: ["SEO Basics"] },
      { stage: 3, title: "Planning & Polishing", items: ["Content Planning", "Editing"] },
      { stage: 4, title: "Build & Prove", items: ["Writing Portfolio"] },
      { stage: 5, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },
  "ux-research": {
    id: "ux-research",
    name: "UX Research",
    tagline: "Understand people, then design for them.",
    category: "humanities",
    coreSkills: ["Research Methods", "Interviewing Skills", "Data Interpretation", "Communication Skills", "Basic Design Awareness"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Research Methods", "Interviewing Skills"] },
      { stage: 2, title: "Making Sense of Findings", items: ["Data Interpretation"] },
      { stage: 3, title: "Working with Designers", items: ["Basic Design Awareness", "Communication Skills"] },
      { stage: 4, title: "Build & Prove", items: ["Research Case Studies"] },
      { stage: 5, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },
  "public-policy-analytics": {
    id: "public-policy-analytics",
    name: "Public Policy & Social Research",
    tagline: "Use evidence to shape better public decisions.",
    category: "humanities",
    coreSkills: ["Research Methods", "Statistics", "Writing Fundamentals", "Data Interpretation", "Communication Skills"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Research Methods", "Statistics"] },
      { stage: 2, title: "Analysis", items: ["Data Interpretation"] },
      { stage: 3, title: "Communicating Findings", items: ["Writing Fundamentals", "Communication Skills"] },
      { stage: 4, title: "Build & Prove", items: ["Policy Briefs / Reports"] },
      { stage: 5, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },

  // -------------------------------------------------------------- pharma --
  "clinical-research": {
    id: "clinical-research",
    name: "Clinical Research",
    tagline: "Help bring new treatments safely to patients.",
    category: "pharma",
    coreSkills: ["Pharmacology Basics", "Clinical Trial Fundamentals", "GCP Guidelines", "Data Documentation", "Statistics"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Pharmacology Basics", "Statistics"] },
      { stage: 2, title: "Trial Knowledge", items: ["Clinical Trial Fundamentals", "GCP Guidelines"] },
      { stage: 3, title: "Practice", items: ["Data Documentation"] },
      { stage: 4, title: "Build & Prove", items: ["Research Coursework Projects"] },
      { stage: 5, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },
  "regulatory-affairs": {
    id: "regulatory-affairs",
    name: "Regulatory Affairs",
    tagline: "Navigate the rules that get medicines approved.",
    category: "pharma",
    coreSkills: ["Pharmacology Basics", "Regulatory Guidelines", "Documentation Skills", "Attention to Detail", "Communication Skills"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Pharmacology Basics"] },
      { stage: 2, title: "Regulatory Knowledge", items: ["Regulatory Guidelines"] },
      { stage: 3, title: "Practice", items: ["Documentation Skills", "Attention to Detail"] },
      { stage: 4, title: "Build & Prove", items: ["Regulatory Case Studies"] },
      { stage: 5, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },
  "pharma-quality": {
    id: "pharma-quality",
    name: "Pharma Quality Assurance",
    tagline: "Make sure every batch is safe and consistent.",
    category: "pharma",
    coreSkills: ["Pharmacology Basics", "GMP Guidelines", "Quality Control Methods", "Documentation Skills", "Attention to Detail"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Pharmacology Basics", "GMP Guidelines"] },
      { stage: 2, title: "Quality Practice", items: ["Quality Control Methods"] },
      { stage: 3, title: "Documentation", items: ["Documentation Skills", "Attention to Detail"] },
      { stage: 4, title: "Build & Prove", items: ["QA Case Studies"] },
      { stage: 5, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },
  "pharma-marketing": {
    id: "pharma-marketing",
    name: "Pharmaceutical Marketing",
    tagline: "Connect life-saving products with the people who need them.",
    category: "pharma",
    coreSkills: ["Pharmacology Basics", "Market Research", "Communication Skills", "Regulatory Awareness", "Campaign Planning"],
    roadmap: [
      { stage: 1, title: "Foundations", items: ["Pharmacology Basics", "Communication Skills"] },
      { stage: 2, title: "Understanding the Market", items: ["Market Research", "Regulatory Awareness"] },
      { stage: 3, title: "Build & Prove", items: ["Campaign Planning", "Case Studies"] },
      { stage: 4, title: "Get Placed", items: ["Internship", "Interview Prep", "Placement"] },
    ],
  },
};

function careersForCategory(category) {
  return Object.values(CAREERS).filter((c) => c.category === category);
}

// Discovery quiz — used for students who select "Not sure yet". Each option
// nudges a set of careers up by weight; scores are summed per career and the
// results are filtered down to the student's own degree category so a BBA
// student never gets recommended Cybersecurity, for example.
const DISCOVERY_QUESTIONS = [
  {
    id: "q1",
    text: "What kind of work sounds most enjoyable to you?",
    options: [
      { label: "Building or creating something from scratch", weights: { "software-development": 3, "content-strategy": 2, "digital-marketing": 1 } },
      { label: "Solving puzzles and logical problems", weights: { "software-development": 2, "cybersecurity": 3, "financial-analysis": 1 } },
      { label: "Finding patterns in data or numbers", weights: { "data-analytics": 3, "business-analytics": 3, "financial-analysis": 2, "hr-analytics": 1 } },
      { label: "Designing how something looks or feels to use", weights: { "ui-ux-design": 3, "ux-research": 2 } },
      { label: "Understanding and helping people", weights: { "ux-research": 2, "hr-analytics": 2, "public-policy-analytics": 2, "clinical-research": 1 } },
    ],
  },
  {
    id: "q2",
    text: "When something goes wrong, what's your instinct?",
    options: [
      { label: "Dig into exactly why it broke", weights: { "software-development": 2, "cybersecurity": 3, "qa-testing": 2, "cloud-devops": 2 } },
      { label: "Check if it's a one-off or a repeating pattern", weights: { "data-analytics": 3, "business-analytics": 2, "qa-testing": 1 } },
      { label: "Think about how it should have been designed differently", weights: { "ui-ux-design": 2, "ux-research": 2 } },
      { label: "Talk to the people involved to understand what happened", weights: { "hr-analytics": 2, "public-policy-analytics": 2, "regulatory-affairs": 1 } },
    ],
  },
  {
    id: "q3",
    text: "Pick a task you'd genuinely rather spend an afternoon on:",
    options: [
      { label: "Writing code to automate something repetitive", weights: { "software-development": 3, "cloud-devops": 2 } },
      { label: "Digging through a messy spreadsheet to find insights", weights: { "data-analytics": 3, "business-analytics": 3, "financial-analysis": 2 } },
      { label: "Sketching a better version of an app screen", weights: { "ui-ux-design": 3, "ux-research": 1 } },
      { label: "Writing something persuasive or explaining an idea clearly", weights: { "content-strategy": 3, "digital-marketing": 2, "public-policy-analytics": 1, "pharma-marketing": 1 } },
      { label: "Checking details carefully so nothing gets missed", weights: { "qa-testing": 3, "pharma-quality": 3, "regulatory-affairs": 2 } },
    ],
  },
  {
    id: "q4",
    text: "Which environment sounds more like you?",
    options: [
      { label: "Deep focus, mostly independent work", weights: { "software-development": 2, "data-analytics": 2, "cybersecurity": 2, "clinical-research": 1 } },
      { label: "Constant collaboration with a team", weights: { "ui-ux-design": 1, "hr-analytics": 2, "digital-marketing": 2, "pharma-marketing": 1 } },
      { label: "A mix, with clear rules and processes to follow", weights: { "regulatory-affairs": 3, "pharma-quality": 2, "qa-testing": 1 } },
      { label: "Research-driven, reading and investigating a lot", weights: { "ux-research": 2, "public-policy-analytics": 3, "clinical-research": 2 } },
    ],
  },
];

module.exports = { CAREERS, careersForCategory, degreeCategory, DISCOVERY_QUESTIONS };