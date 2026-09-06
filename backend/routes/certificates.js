const express = require("express");
const crypto = require("crypto");
const multer = require("multer");
const QRCode = require("qrcode");
const { load, save, nextId } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ dest: "uploads/certificates/" });

// ---- INTERNAL: college issues a certificate directly ----
router.post("/issue", requireAuth, requireRole("college"), (req, res) => {
  const { studentId, studentName, courseName, issuedBy } = req.body;
  if (!studentId || !courseName) {
    return res.status(400).json({ error: "studentId and courseName required" });
  }

  const db = load();
  const id = nextId(db, "certificates");
  const certId = "CERT-" + crypto.randomBytes(4).toString("hex").toUpperCase();

  const certificate = {
    id,
    certId,
    studentId,
    studentName,
    courseName,
    issuedBy: issuedBy || "System",
    source: "internal",
    status: "verified",
    issueDate: new Date().toISOString(),
  };

  db.certificates.push(certificate);
  save(db);
  res.json({ success: true, certificate });
});

// ---- EXTERNAL: student uploads a certificate for manual review ----
router.post("/submit-external", requireAuth, requireRole("student"), upload.single("certFile"), (req, res) => {
  const { studentId, studentName, courseName, issuerName } = req.body;
  if (!studentId || !courseName || !issuerName) {
    return res.status(400).json({ error: "studentId, courseName, issuerName required" });
  }

  const actualStudentId = studentId === "me" ? String(req.user.id) : studentId;

  const db = load();
  const id = nextId(db, "certificates");
  const certId = "EXT-" + Date.now();

  const certificate = {
    id,
    certId,
    studentId: actualStudentId,
    studentName,
    courseName,
    issuerName,
    source: "external",
    fileUrl: req.file ? "/uploads/certificates/" + req.file.filename : null,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };

  db.certificates.push(certificate);
  save(db);
  res.json({ success: true, certificate });
});

// ---- Admin/college: view pending external certificates ----
router.get("/pending", requireAuth, requireRole("admin"), (req, res) => {
  const db = load();
  res.json(db.certificates.filter((c) => c.status === "pending"));
});

// ---- Admin/college: approve or reject external certificate ----
router.post("/review/:certId", requireAuth, requireRole("admin"), (req, res) => {
  const { decision, reviewerName } = req.body;
  const db = load();
  const cert = db.certificates.find((c) => c.certId === req.params.certId);
  if (!cert) return res.status(404).json({ error: "Not found" });

  cert.status = decision;
  cert.reviewedBy = reviewerName;
  cert.reviewedAt = new Date().toISOString();
  save(db);
  res.json({ success: true, certificate: cert });
});

// ---- Public: verify any certificate by ID (no login needed) ----
router.get("/verify/:certId", (req, res) => {
  const db = load();
  const cert = db.certificates.find((c) => c.certId === req.params.certId);
  if (!cert) return res.status(404).json({ valid: false, message: "Certificate not found" });
  res.json({ valid: cert.status === "verified", certificate: cert });
});

// ---- Generate QR code for a certificate ----
router.get("/qr/:certId", requireAuth, async (req, res) => {
  const verifyUrl = `${req.protocol}://${req.get("host")}/verify/${req.params.certId}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl);
  res.json({ qr: qrDataUrl, verifyUrl });
});

// ---- List all certificates for one student ----
router.get("/student/:studentId", requireAuth, (req, res) => {
  const db = load();
  const targetId = req.params.studentId === "me" ? String(req.user.id) : req.params.studentId;
  const certs = db.certificates.filter((c) => c.studentId === targetId);
  res.json(certs);
});

module.exports = router;
