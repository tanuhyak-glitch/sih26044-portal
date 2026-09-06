import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { DEGREES, yearsForDegree } from "../degrees";

const ROLES = [
  { key: "student", label: "Student", desc: "Map skills, find matches" },
  { key: "industry", label: "Industry", desc: "Post roles, screen talent" },
  { key: "college", label: "College TPO", desc: "Track your students" },
];

const DEMO_LOGINS = [
  { role: "Student", email: "student@nit.edu.in" },
  { role: "Industry", email: "hr@technova.com" },
  { role: "College TPO", email: "college@nit.edu.in" },
  { role: "Admin", email: "admin@sih26044.gov.in" },
];

const OAUTH_BUTTONS = [
  { key: "google", label: "Continue with Google" },
  { key: "github", label: "Continue with GitHub" },
  { key: "linkedin", label: "Continue with LinkedIn" },
];

export default function AuthPage() {
  const { onAuthSuccess } = useAuth();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("student");
  const [colleges, setColleges] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthProviders, setOauthProviders] = useState({});

  // "form" = collecting registration details, "otp" = verifying the
  // emailed code before the account is actually created.
  const [registerStage, setRegisterStage] = useState("form");
  const [otp, setOtp] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", password: "", orgName: "", degree: "", branch: "", year: "", collegeId: "",
  });

  useEffect(() => {
    if (mode === "register" && role === "student") {
      api.colleges().then((d) => setColleges(d.colleges)).catch(() => {});
    }
  }, [mode, role]);

  useEffect(() => {
    api.oauthProviders().then(setOauthProviders).catch(() => {});
  }, []);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function fillDemo(email) {
    setMode("login");
    setForm((f) => ({ ...f, email, password: "password123" }));
    setError("");
  }

  function switchMode(next) {
    setMode(next);
    setRegisterStage("form");
    setError("");
    setInfo("");
    setOtp("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "login") {
        const data = await api.login({ email: form.email, password: form.password });
        onAuthSuccess(data);
        return;
      }

      // Registration, step 1: send the OTP.
      const data = await api.registerStart({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        orgName: form.orgName,
        degree: form.degree,
        branch: form.branch,
        year: form.year,
        collegeId: form.collegeId,
      });
      setInfo(
        data.devOtp
          ? `No email server configured — your code is ${data.devOtp} (also printed in the backend terminal).`
          : "We've emailed you a 6-digit code. It expires in 10 minutes."
      );
      setRegisterStage("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api.registerVerify({ email: form.email, otp });
      onAuthSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const data = await api.registerResend(form.email);
      setInfo(data.devOtp ? `New code: ${data.devOtp}` : "A new code has been sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const anyOauthEnabled = Object.values(oauthProviders).some(Boolean);

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="sidebar-brand" style={{ border: "none", padding: 0, marginBottom: 0 }}>
              <div className="mark">S</div>
              <div>
                <div className="name">Setu</div>
                <div className="sub">SIH26044 · Skill Portal</div>
              </div>
            </div>
          </div>
          <h1 className="headline">
            One bridge between <em>classrooms</em> and <em>careers</em>.
          </h1>
          <p style={{ color: "#A9B6D6", maxWidth: 440, marginTop: 16, fontSize: 14.5 }}>
            Setu maps every student's real skills against what industry actually
            needs — then ranks internships and candidates by fit, not by
            keyword-matching a resume.
          </p>
          <div className="stats">
            <div>
              <div className="stat-num">4</div>
              <div className="stat-label">Connected roles</div>
            </div>
            <div>
              <div className="stat-num">Live</div>
              <div className="stat-label">Skill-match engine</div>
            </div>
            <div>
              <div className="stat-num">100%</div>
              <div className="stat-label">Explainable scoring</div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#8494BA", marginBottom: 8, letterSpacing: "0.02em" }}>
            Judge demo logins — password is password123
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {DEMO_LOGINS.map((d) => (
              <button
                key={d.email}
                onClick={() => fillDemo(d.email)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  color: "#fff",
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  cursor: "pointer",
                }}
              >
                {d.role}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>
              Log in
            </button>
            <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => switchMode("register")}>
              Create account
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}
          {info && !error && <div className="success-banner">{info}</div>}

          {mode === "register" && registerStage === "otp" ? (
            <form onSubmit={handleVerifyOtp}>
              <div className="field">
                <label>Enter the 6-digit code sent to {form.email}</label>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="042198"
                  style={{ letterSpacing: "0.3em", fontSize: 20, textAlign: "center" }}
                />
              </div>
              <button className="btn btn-primary btn-block" disabled={busy || otp.length !== 6} type="submit">
                {busy ? "Verifying…" : "Verify & create account"}
              </button>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRegisterStage("form")}>
                  ← Edit details
                </button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={handleResendOtp}>
                  Resend code
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                {mode === "register" && (
                  <>
                    <div className="role-picker">
                      {ROLES.map((r) => (
                        <button
                          type="button"
                          key={r.key}
                          className={`role-option ${role === r.key ? "active" : ""}`}
                          onClick={() => setRole(r.key)}
                        >
                          {r.label}
                          <span className="desc">{r.desc}</span>
                        </button>
                      ))}
                    </div>

                    <div className="field">
                      <label>Full name</label>
                      <input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Aarav Kapoor" />
                    </div>

                    {role !== "student" && (
                      <div className="field">
                        <label>{role === "industry" ? "Company name" : "College / Institute name"}</label>
                        <input
                          required
                          value={form.orgName}
                          onChange={(e) => update("orgName", e.target.value)}
                          placeholder={role === "industry" ? "e.g. TechNova Solutions Pvt. Ltd." : "e.g. National Institute of Technology"}
                        />
                      </div>
                    )}

                    {role === "student" && (
                      <>
                        <div className="field">
                          <label>College</label>
                          <select value={form.collegeId} onChange={(e) => update("collegeId", e.target.value)}>
                            <option value="">Select your college (optional for demo)</option>
                            {colleges.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="field-row">
                          <div className="field">
                            <label>Degree</label>
                            <select
                              value={form.degree}
                              onChange={(e) => {
                                update("degree", e.target.value);
                                update("year", "");
                              }}
                            >
                              <option value="">Select your degree</option>
                              {DEGREES.map((d) => (
                                <option key={d.key} value={d.label}>{d.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>Branch</label>
                            <input value={form.branch} onChange={(e) => update("branch", e.target.value)} placeholder="Computer Science" />
                          </div>
                        </div>
                        <div className="field">
                          <label>Year</label>
                          <select
                            value={form.year}
                            onChange={(e) => update("year", e.target.value)}
                            disabled={!form.degree}
                          >
                            <option value="">{form.degree ? "Select year" : "Select a degree first"}</option>
                            {Array.from({ length: yearsForDegree(form.degree) }, (_, i) => i + 1).map((y) => (
                              <option key={y} value={y}>{`Year ${y}`}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>

                <button className="btn btn-primary btn-block" disabled={busy} type="submit">
                  {busy ? "Please wait…" : mode === "login" ? "Log in" : "Send verification code"}
                </button>
              </form>

              {anyOauthEnabled && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0", color: "var(--text-muted)", fontSize: 12 }}>
                    <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
                    or
                    <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {OAUTH_BUTTONS.filter((b) => oauthProviders[b.key]).map((b) => (
                      <a
                        key={b.key}
                        className="btn btn-ghost btn-block"
                        href={api.oauthStartUrl(b.key, mode === "register" ? role : "student")}
                        style={{ textAlign: "center", textDecoration: "none" }}
                      >
                        {b.label}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
