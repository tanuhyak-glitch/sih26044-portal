// data/seed.js
// Populates the database with a master skill list and one ready-to-use demo
// account per role, plus a couple of extra students/opportunities so charts
// and rankings aren't empty on first run. Run with: npm run seed
// (server.js also calls this automatically the very first time it starts).

const bcrypt = require("bcryptjs");
const { load, save, nextId } = require("../db");

const SKILLS_MASTER = [
  "JavaScript", "Python", "Java", "C++", "React", "Node.js", "SQL",
  "Data Structures & Algorithms", "Machine Learning", "Deep Learning",
  "Cloud Computing (AWS)", "Docker", "Git & GitHub", "REST APIs",
  "Communication", "Problem Solving", "UI/UX Design", "DevOps",
  "Cybersecurity Basics", "Data Analysis", "Excel", "Figma",
  "Android Development", "Embedded Systems", "Digital Marketing",
];

function hash(pw) {
  return bcrypt.hashSync(pw, 8);
}

function seed() {
  const db = load();
  if (db.users.length > 0) {
    console.log("Database already has data — skipping seed. Delete data/db.json to reseed.");
    return;
  }

  db.skillsMaster = SKILLS_MASTER;

  // ---- Admin ----
  const adminId = nextId(db, "users");
  db.users.push({
    id: adminId, name: "Priya Sharma", email: "admin@sih26044.gov.in",
    passwordHash: hash("password123"), role: "admin", orgName: "SIH Nodal Office",
  });

  // ---- College (Training & Placement Officer) ----
  const collegeId = nextId(db, "users");
  db.users.push({
    id: collegeId, name: "Dr. Rakesh Menon", email: "college@nit.edu.in",
    passwordHash: hash("password123"), role: "college", orgName: "National Institute of Technology",
  });

  // ---- Industry ----
  const industryId = nextId(db, "users");
  db.users.push({
    id: industryId, name: "Anita Verma", email: "hr@technova.com",
    passwordHash: hash("password123"), role: "industry", orgName: "TechNova Solutions Pvt. Ltd.",
  });

  const industryId2 = nextId(db, "users");
  db.users.push({
    id: industryId2, name: "Karan Patel", email: "hr@greengrid.com",
    passwordHash: hash("password123"), role: "industry", orgName: "GreenGrid Energy Systems",
  });

  // ---- Students ----
  function makeStudent(name, email, branch, year, skillPairs) {
    const id = nextId(db, "users");
    db.users.push({
      id, name, email, passwordHash: hash("password123"), role: "student",
      orgName: "National Institute of Technology",
    });
    db.studentProfiles.push({
      userId: id, collegeUserId: collegeId, branch, year,
      degree: "B.Tech", semester: String(Number(year) * 2),
      bio: "", skills: skillPairs.map(([skillName, level]) => ({ skillName, level })),
      completedCourses: [], projects: [], internships: [], interests: [],
      careerStatus: "exploring", githubUrl: "", linkedinUrl: "",
      careerGoal: null, freeTimeSlots: [], mentorSuggestions: [],
      // Seeded demo accounts skip the onboarding wizard so judges can log
      // straight into a populated dashboard.
      onboardingComplete: true,
    });
    return id;
  }

  const demoStudentId = makeStudent(
    "Aarav Kapoor", "student@nit.edu.in", "Computer Science", 3,
    [["JavaScript", 4], ["React", 3], ["Git & GitHub", 4], ["Communication", 3], ["SQL", 2]]
  );
  makeStudent("Sneha Iyer", "sneha@nit.edu.in", "Computer Science", 4,
    [["Python", 5], ["Machine Learning", 4], ["Data Analysis", 4], ["SQL", 3], ["Communication", 4]]);
  makeStudent("Rohan Das", "rohan@nit.edu.in", "Electronics", 3,
    [["Embedded Systems", 4], ["C++", 3], ["Problem Solving", 3]]);
  makeStudent("Meera Nair", "meera@nit.edu.in", "Computer Science", 2,
    [["JavaScript", 2], ["Figma", 3], ["UI/UX Design", 3]]);
  makeStudent("Vikram Singh", "vikram@nit.edu.in", "Mechanical", 4,
    [["Problem Solving", 4], ["Excel", 3], ["Communication", 3]]);

  // ---- Opportunities ----
  const oppId1 = nextId(db, "opportunities");
  db.opportunities.push({
    id: oppId1, industryUserId: industryId, companyName: "TechNova Solutions Pvt. Ltd.",
    title: "Frontend Engineering Intern", type: "internship",
    description: "Work with our web platform team building customer-facing dashboards using React.",
    location: "Bengaluru (Hybrid)", stipend: "₹18,000/month", seats: 3, status: "open",
    requiredSkills: [
      { skillName: "JavaScript", level: 3 },
      { skillName: "React", level: 3 },
      { skillName: "Git & GitHub", level: 2 },
      { skillName: "Communication", level: 2 },
    ],
    createdAt: new Date().toISOString(),
  });

  const oppId2 = nextId(db, "opportunities");
  db.opportunities.push({
    id: oppId2, industryUserId: industryId, companyName: "TechNova Solutions Pvt. Ltd.",
    title: "Data Analyst Intern", type: "internship",
    description: "Analyse product usage data and build reporting dashboards for leadership.",
    location: "Remote", stipend: "₹15,000/month", seats: 2, status: "open",
    requiredSkills: [
      { skillName: "Python", level: 3 },
      { skillName: "SQL", level: 3 },
      { skillName: "Data Analysis", level: 3 },
    ],
    createdAt: new Date().toISOString(),
  });

  const oppId3 = nextId(db, "opportunities");
  db.opportunities.push({
    id: oppId3, industryUserId: industryId2, companyName: "GreenGrid Energy Systems",
    title: "Embedded Systems Trainee", type: "job",
    description: "Design and test firmware for smart-grid IoT devices.",
    location: "Pune (On-site)", stipend: "₹6,50,000/year", seats: 1, status: "open",
    requiredSkills: [
      { skillName: "Embedded Systems", level: 3 },
      { skillName: "C++", level: 3 },
      { skillName: "Problem Solving", level: 3 },
    ],
    createdAt: new Date().toISOString(),
  });

  // ---- One sample application so the industry dashboard isn't empty ----
  const appId = nextId(db, "applications");
  db.applications.push({
    id: appId, opportunityId: oppId1, studentUserId: demoStudentId,
    matchScore: 88, status: "applied", appliedAt: new Date().toISOString(),
  });

  save(db);
  console.log("Seed complete. Demo logins (password for all: password123):");
  console.log("  Admin:    admin@sih26044.gov.in");
  console.log("  College:  college@nit.edu.in");
  console.log("  Industry: hr@technova.com");
  console.log("  Student:  student@nit.edu.in");
}

if (require.main === module) {
  seed();
}

module.exports = seed;
