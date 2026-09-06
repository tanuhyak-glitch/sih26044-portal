// data/projectTemplates.js
// Rule-based project suggestions (no external AI/LLM call is configured in
// this project) keyed by career track and skill level. Kept small and
// curated so recommendations stay sensible instead of generic.

module.exports = {
  "software-development": {
    beginner: {
      title: "Personal Task Tracker (Web App)",
      stack: ["HTML/CSS/JavaScript", "LocalStorage or a simple Node.js + Express backend"],
      phases: [
        "Wireframe the task list, add/edit/delete flows",
        "Build the UI with plain HTML/CSS/JS",
        "Add a backend (Express) with a REST API for tasks",
        "Persist tasks (file or SQLite) and add basic filtering",
        "Deploy to a free host (Render/Netlify) and write a README",
      ],
      resources: ["MDN Web Docs — JavaScript basics", "Express.js official guide"],
    },
    intermediate: {
      title: "Campus Lost & Found Portal",
      stack: ["React", "Node.js + Express", "SQLite or MongoDB"],
      phases: [
        "Design the data model: items, categories, claim requests",
        "Build the API: CRUD for items, search, claim workflow",
        "Build the React frontend with search/filter",
        "Add auth so only the reporter/claimer can update a listing",
        "Deploy and document the architecture",
      ],
      resources: ["React official docs — Learn", "REST API design basics"],
    },
    advanced: {
      title: "Real-time Collaborative Notes App",
      stack: ["React", "Node.js + Express", "WebSockets (Socket.IO)", "PostgreSQL"],
      phases: [
        "Design schema for notes, versions, and collaborators",
        "Build the API + WebSocket layer for live sync",
        "Handle conflict resolution for concurrent edits",
        "Add auth, sharing links, and role-based permissions",
        "Load-test, then deploy with a managed Postgres instance",
      ],
      resources: ["Socket.IO docs", "Operational Transformation / CRDT primer"],
    },
  },
  "data-analytics": {
    beginner: {
      title: "College Placement Trends Dashboard",
      stack: ["Python", "Pandas", "Matplotlib/Seaborn"],
      phases: [
        "Collect or simulate a placement dataset (branch, package, year)",
        "Clean the data with Pandas",
        "Compute summary stats (average package by branch/year)",
        "Build 3–4 charts telling a clear story",
        "Write a short report with your findings",
      ],
      resources: ["Kaggle — Pandas micro-course", "Matplotlib gallery"],
    },
    intermediate: {
      title: "Skill-Demand Analyzer for Job Postings",
      stack: ["Python", "Pandas", "SQL", "Plotly/Streamlit"],
      phases: [
        "Gather a sample of job postings (CSV) with required skills",
        "Load into SQLite, write SQL queries for skill frequency",
        "Build an interactive Streamlit dashboard",
        "Add trend-over-time analysis if postings have dates",
        "Deploy the dashboard (Streamlit Community Cloud)",
      ],
      resources: ["Streamlit docs", "SQL for Data Analysis (Mode)"],
    },
    advanced: {
      title: "Predictive Model for Internship Selection Likelihood",
      stack: ["Python", "Pandas", "scikit-learn", "Streamlit"],
      phases: [
        "Assemble a labelled dataset (skills, CGPA, outcome)",
        "Feature-engineer and handle class imbalance",
        "Train and compare 2–3 classification models",
        "Explain predictions (feature importance / SHAP)",
        "Wrap in a simple app and document model limitations honestly",
      ],
      resources: ["scikit-learn user guide", "SHAP documentation"],
    },
  },
  cybersecurity: {
    beginner: {
      title: "Personal Password Strength & Breach Checker",
      stack: ["Python", "Have I Been Pwned API (k-anonymity endpoint)"],
      phases: [
        "Learn password entropy and common weaknesses",
        "Build a CLI tool that scores password strength",
        "Integrate the HIBP k-anonymity API for breach checks",
        "Add a simple report/output format",
        "Document responsible use and rate-limit handling",
      ],
      resources: ["OWASP — Authentication Cheat Sheet", "HIBP API docs"],
    },
    intermediate: {
      title: "Home Network Vulnerability Scanner",
      stack: ["Python", "nmap (python-nmap)", "Flask (report UI)"],
      phases: [
        "Set up an isolated lab network (VirtualBox/VMs) — never scan networks you don't own",
        "Automate host/port discovery with nmap",
        "Flag common misconfigurations (open ports, default creds)",
        "Generate a readable HTML/Flask report",
        "Write a responsible-disclosure style write-up",
      ],
      resources: ["nmap official docs", "OWASP Testing Guide"],
    },
    advanced: {
      title: "Web App Security Audit + Fix (on a lab target)",
      stack: ["Burp Suite / OWASP ZAP", "Python", "A deliberately vulnerable app (e.g. DVWA/Juice Shop)"],
      phases: [
        "Set up a legal practice target (DVWA or OWASP Juice Shop)",
        "Run and interpret an automated scan (ZAP)",
        "Manually verify 3–5 OWASP Top 10 findings",
        "Fix the vulnerabilities in a forked copy of the app",
        "Write a before/after security report",
      ],
      resources: ["OWASP Top 10", "PortSwigger Web Security Academy"],
    },
  },
  "ui-ux-design": {
    beginner: {
      title: "Redesign a Campus Service's Mobile Screen",
      stack: ["Figma"],
      phases: [
        "Pick a clunky campus app/website flow (e.g. mess menu, library)",
        "Sketch the current user journey and pain points",
        "Wireframe an improved flow in Figma",
        "Add a simple visual design pass (type, color, spacing)",
        "Write a one-page case study explaining your decisions",
      ],
      resources: ["Figma basics course", "Laws of UX (lawsofux.com)"],
    },
    intermediate: {
      title: "End-to-End App Concept with User Research",
      stack: ["Figma", "Google Forms (research)"],
      phases: [
        "Interview 5+ students about a real problem",
        "Synthesize findings into personas and a problem statement",
        "Wireframe → mid-fidelity → high-fidelity screens",
        "Run a 5-user usability test on the prototype",
        "Iterate once based on findings and document changes",
      ],
      resources: ["Nielsen Norman Group — usability testing 101"],
    },
    advanced: {
      title: "Design System for a Multi-Screen Product",
      stack: ["Figma", "Figma component/variants + auto-layout"],
      phases: [
        "Audit an existing app for inconsistency",
        "Define tokens: color, type scale, spacing, elevation",
        "Build a reusable component library with variants",
        "Apply it across 8–10 real screens",
        "Document usage guidelines for future contributors",
      ],
      resources: ["Design Systems Handbook (InVision)", "Figma variants docs"],
    },
  },
};
