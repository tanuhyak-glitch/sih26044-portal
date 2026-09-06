import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import { DEGREES, yearsForDegree } from "../../degrees";

const CAREER_OPTIONS = [
  { key: "known", label: "I already know my career", desc: "Take me straight to my roadmap" },
  { key: "exploring", label: "I have multiple career interests", desc: "Help me compare a few options" },
  { key: "unsure", label: "I'm not sure which career I want", desc: "Guide me through AI career discovery" },
];

function TagField({ label, placeholder, values, onChange, hint }) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const v = draft.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setDraft("");
  }

  function removeTag(v) {
    onChange(values.filter((x) => x !== v));
  }

  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
        />
        <button type="button" className="btn btn-ghost btn-sm" onClick={addTag}>
          Add
        </button>
      </div>
      {hint && <div className="field-hint">{hint}</div>}
      {values.length > 0 && (
        <div className="chip-row" style={{ marginTop: 8 }}>
          {values.map((v) => (
            <span key={v} className="chip">
              {v}
              <button type="button" onClick={() => removeTag(v)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OnboardingWizard({ onComplete }) {
  const { token } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [colleges, setColleges] = useState([]);

  const [form, setForm] = useState({
    collegeId: "",
    degree: "",
    branch: "",
    year: "",
    semester: "",
    completedCourses: [],
    skills: [],
    skillDraftName: "",
    skillDraftLevel: 3,
    projects: [],
    internships: [],
    githubUrl: "",
    linkedinUrl: "",
    interests: [],
    careerStatus: "",
  });

  useEffect(() => {
    api.colleges().then((d) => setColleges(d.colleges)).catch(() => {});
  }, []);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addSkill() {
    const name = form.skillDraftName.trim();
    if (!name) return;
    if (form.skills.some((s) => s.skillName.toLowerCase() === name.toLowerCase())) return;
    set("skills", [...form.skills, { skillName: name, level: Number(form.skillDraftLevel) }]);
    set("skillDraftName", "");
  }

  function removeSkill(name) {
    set("skills", form.skills.filter((s) => s.skillName !== name));
  }

  async function saveStep(extra = {}, { finalStep = false } = {}) {
    setError("");
    setBusy(true);
    try {
      const body = {
        collegeId: form.collegeId || undefined,
        degree: form.degree,
        branch: form.branch,
        year: form.year,
        semester: form.semester,
        completedCourses: form.completedCourses,
        skills: form.skills,
        projects: form.projects,
        internships: form.internships,
        githubUrl: form.githubUrl,
        linkedinUrl: form.linkedinUrl,
        interests: form.interests,
        careerStatus: form.careerStatus || null,
        ...extra,
      };
      const data = await api.saveOnboarding(token, body);
      if (finalStep) {
        onComplete(data.onboarding);
      } else {
        setStep((s) => s + 1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const steps = ["Academics", "Skills & evidence", "Interests & career", "Review"];

  return (
    <div className="auth-shell" style={{ gridTemplateColumns: "1fr" }}>
      <div className="auth-form-panel" style={{ margin: "0 auto", width: "100%", maxWidth: 640 }}>
        <div className="auth-card">
          <div className="page-head" style={{ marginBottom: 20 }}>
            <div className="eyebrow">Welcome — let's set up your profile</div>
            <h1 style={{ fontSize: 20 }}>{steps[step]}</h1>
          </div>

          <div className="tabs" style={{ marginBottom: 20 }}>
            {steps.map((s, i) => (
              <div key={s} className={`tab-btn ${i === step ? "active" : ""}`} style={{ cursor: "default" }}>
                {i + 1}. {s}
              </div>
            ))}
          </div>

          {error && <div className="error-banner">{error}</div>}

          {step === 0 && (
            <>
              <div className="field">
                <label>College</label>
                <select value={form.collegeId} onChange={(e) => set("collegeId", e.target.value)}>
                  <option value="">Select your college</option>
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
                    onChange={(e) => { set("degree", e.target.value); set("year", ""); }}
                  >
                    <option value="">Select your degree</option>
                    {DEGREES.map((d) => (
                      <option key={d.key} value={d.label}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Branch / Stream</label>
                  <input value={form.branch} onChange={(e) => set("branch", e.target.value)} placeholder="Computer Science" />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Year</label>
                  <select value={form.year} onChange={(e) => set("year", e.target.value)} disabled={!form.degree}>
                    <option value="">{form.degree ? "Select year" : "Select a degree first"}</option>
                    {Array.from({ length: yearsForDegree(form.degree) }, (_, i) => i + 1).map((y) => (
                      <option key={y} value={y}>{`Year ${y}`}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Semester</label>
                  <input value={form.semester} onChange={(e) => set("semester", e.target.value)} placeholder="6" />
                </div>
              </div>
              <TagField
                label="Completed courses / subjects"
                placeholder="e.g. Database Management"
                values={form.completedCourses}
                onChange={(v) => set("completedCourses", v)}
                hint="Press Enter or Add after each course."
              />
              <button className="btn btn-primary btn-block" disabled={busy} onClick={() => saveStep()}>
                {busy ? "Saving…" : "Continue"}
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="field">
                <label>Existing skills</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={form.skillDraftName}
                    onChange={(e) => set("skillDraftName", e.target.value)}
                    placeholder="e.g. Python"
                    style={{ flex: 2 }}
                  />
                  <select
                    value={form.skillDraftLevel}
                    onChange={(e) => set("skillDraftLevel", e.target.value)}
                    style={{ flex: 1 }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>Level {n}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addSkill}>Add</button>
                </div>
                {form.skills.length > 0 && (
                  <div className="chip-row" style={{ marginTop: 8 }}>
                    {form.skills.map((s) => (
                      <span key={s.skillName} className="chip">
                        {s.skillName} · L{s.level}
                        <button type="button" onClick={() => removeSkill(s.skillName)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <TagField
                label="Projects (title, one at a time)"
                placeholder="e.g. Campus event finder app"
                values={form.projects}
                onChange={(v) => set("projects", v)}
              />
              <TagField
                label="Internships (company / role)"
                placeholder="e.g. TechNova — Frontend Intern"
                values={form.internships}
                onChange={(v) => set("internships", v)}
              />
              <div className="field-row">
                <div className="field">
                  <label>GitHub profile</label>
                  <input value={form.githubUrl} onChange={(e) => set("githubUrl", e.target.value)} placeholder="https://github.com/you" />
                </div>
                <div className="field">
                  <label>LinkedIn profile</label>
                  <input value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/you" />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setStep(0)}>Back</button>
                <button className="btn btn-primary btn-block" disabled={busy} onClick={() => saveStep()}>
                  {busy ? "Saving…" : "Continue"}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <TagField
                label="Interests"
                placeholder="e.g. Cybersecurity, Design"
                values={form.interests}
                onChange={(v) => set("interests", v)}
              />
              <div className="field">
                <label>How sure are you about your career direction?</label>
                <div className="role-picker" style={{ gridTemplateColumns: "1fr" }}>
                  {CAREER_OPTIONS.map((o) => (
                    <button
                      type="button"
                      key={o.key}
                      className={`role-option ${form.careerStatus === o.key ? "active" : ""}`}
                      onClick={() => set("careerStatus", o.key)}
                    >
                      {o.label}
                      <span className="desc">{o.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                <button
                  className="btn btn-primary btn-block"
                  disabled={busy || !form.careerStatus}
                  onClick={() => saveStep()}
                >
                  {busy ? "Saving…" : "Continue"}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="panel-sub">
                Quick check before we finish — you can always change these later from your profile.
              </div>
              <ul style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.9, marginBottom: 16 }}>
                <li>{form.degree || "—"} · {form.branch || "—"} · Year {form.year || "—"}, Sem {form.semester || "—"}</li>
                <li>{form.skills.length} skill(s), {form.projects.length} project(s), {form.internships.length} internship(s)</li>
                <li>Career status: {CAREER_OPTIONS.find((o) => o.key === form.careerStatus)?.label || "—"}</li>
              </ul>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
                <button
                  className="btn btn-accent btn-block"
                  disabled={busy}
                  onClick={() => saveStep({ complete: true}, { finalStep: true })}
                >
                  {busy ? "Finishing…" : "Finish setup"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
