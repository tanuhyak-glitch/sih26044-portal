require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const { DB_FILE } = require("./db");
const seed = require("./data/seed");

const authRoutes = require("./routes/auth");
const onboardingRoutes = require("./routes/onboarding");
const careerRoutes = require("./routes/career");
const plannerRoutes = require("./routes/planner");
const projectMentorRoutes = require("./routes/project-mentor");
const studentRoutes = require("./routes/students");
const opportunityRoutes = require("./routes/opportunities");
const applicationRoutes = require("./routes/applications");
const notificationRoutes = require("./routes/notifications");
const analyticsRoutes = require("./routes/analytics");
const metaRoutes = require("./routes/meta");
const certificateRoutes = require("./routes/certificates");
const recommendationRoutes = require("./routes/recommendations");
const feedbackRoutes = require("./routes/feedback");
const trainingRoutes = require("./routes/training");
const resumeBuilderRoutes = require("./routes/resume-builder");
const skillHistoryRoutes = require("./routes/skill-history");
const extractionRoutes = require("./routes/extraction");

// First run: create and seed the database so the app is demo-ready
// the moment it starts, with zero manual setup steps.
if (!fs.existsSync(DB_FILE)) {
  seed();
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "SIH26044 API" }));

app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/career", careerRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/project-mentor", projectMentorRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/resume-builder", resumeBuilderRoutes);
app.use("/api/skill-history", skillHistoryRoutes);
app.use("/api/extraction", extractionRoutes);

// Fallback 404 for unknown API routes
app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// Generic error handler so a thrown error never crashes the demo mid-pitch
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SIH26044 API running at http://localhost:${PORT}`);
});
