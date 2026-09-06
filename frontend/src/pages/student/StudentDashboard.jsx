import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import { MatchBadge, SkillBar, StatusPill, EmptyState } from "../../components/Bits";

const NAV = [
  { key: "overview", label: "Overview", icon: "◈" },
  { key: "career", label: "Career & Roadmap", icon: "⬡" },
  { key: "planner", label: "Academic Planner", icon: "▦" },
  { key: "mentor", label: "Project Mentor", icon: "✎" },
  { key: "skills", label: "My Skill Profile", icon: "◐" },
  { key: "browse", label: "Browse Opportunities", icon: "◇" },
  { key: "applications", label: "My Applications", icon: "◆" },
  { key: "certificates", label: "Certificates", icon: "★" },
  { key: "recommendations", label: "Recommended Skills", icon: "▲" },
  { key: "resume", label: "My Resume", icon: "▤" },
];

const LEVEL_LABELS = { 1: "Beginner", 2: "Basic", 3: "Working", 4: "Strong", 5: "Expert" };

export default function StudentDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const [p, o, a] = await Promise.all([
      api.myProfile(token),
      api.opportunities(token),
      api.myApplications(token),
    ]);
    setProfile(p.profile);
    setOpportunities(o.opportunities);
    setApplications(a.applications);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []); // eslint-disable-line

  return (
    <DashboardLayout navItems={NAV} activeTab={tab} onTabChange={setTab}>
      <div className="page-head">
        <div className="eyebrow">Student workspace</div>
        <h1>{tab === "overview" ? "Your career readiness" : NAV.find((n) => n.key === tab)?.label}</h1>
      </div>

      {loading ? (
        <div className="loading-line">Loading your data…</div>
      ) : tab === "overview" ? (
        <Overview profile={profile} opportunities={opportunities} applications={applications} onGo={setTab} />
      ) : tab === "career" ? (
        <CareerRoadmap token={token} />
      ) : tab === "planner" ? (
        <AcademicPlanner token={token} />
      ) : tab === "mentor" ? (
        <ProjectMentor token={token} />
      ) : tab === "skills" ? (
        <SkillProfile token={token} profile={profile} onUpdated={loadAll} />
      ) : tab === "browse" ? (
        <Browse token={token} opportunities={opportunities} onApplied={loadAll} />
      ) : tab === "applications" ? (
        <Applications applications={applications} />
      ) : tab === "certificates" ? (
        <Certificates token={token} />
      ) : tab === "recommendations" ? (
        <Recommendations token={token} />
      ) : (
        <ResumeBuilder token={token} />
      )}
    </DashboardLayout>
  );
}

function Overview({ profile, opportunities, applications, onGo }) {
  const skillCount = profile?.skills?.length || 0;
  const bestMatch = opportunities.reduce((max, o) => Math.max(max, o.matchScore || 0), 0);
  const topOpps = [...opportunities].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 3);

  return (
    <>
      <div className="stat-row">
        <div className="stat-hero">
          <div>
            <div className="num">{bestMatch}%</div>
            <div className="label">Your best skill match right now</div>
          </div>
          <button className="btn btn-accent btn-sm" style={{ marginTop: 14, width: "fit-content" }} onClick={() => onGo("browse")}>
            View matches
          </button>
        </div>
        <div className="stat-card">
          <div className="num">{skillCount}</div>
          <div className="label">Skills mapped</div>
        </div>
        <div className="stat-card">
          <div className="num">{opportunities.length}</div>
          <div className="label">Open opportunities</div>
        </div>
        <div className="stat-card">
          <div className="num">{applications.length}</div>
          <div className="label">Applications sent</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Best matches for your profile</div>
        <div className="panel-sub">Ranked by our skill-matching engine against opportunities' requirements.</div>
        {skillCount === 0 ? (
          <EmptyState glyph="◐" title="Add your skills to see personalised matches" hint='Go to "My Skill Profile" to get started — it takes under a minute.' />
        ) : topOpps.length === 0 ? (
          <EmptyState glyph="◇" title="No open opportunities yet" />
        ) : (
          <table>
            <thead>
              <tr><th>Opportunity</th><th>Company</th><th>Type</th><th>Match</th></tr>
            </thead>
            <tbody>
              {topOpps.map((o) => (
                <tr key={o.id}>
                  <td>{o.title}</td>
                  <td>{o.companyName}</td>
                  <td style={{ textTransform: "capitalize" }}>{o.type}</td>
                  <td><MatchBadge score={o.matchScore || 0} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function SkillProfile({ token, profile, onUpdated }) {
  const [branch, setBranch] = useState(profile?.branch || "");
  const [year, setYear] = useState(profile?.year || "");
  const [skills, setSkills] = useState(profile?.skills || []);
  const [skillName, setSkillName] = useState("");
  const [level, setLevel] = useState(3);
  const [master, setMaster] = useState([]);
  const [savedMsg, setSavedMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.skillsMaster(token).then((d) => setMaster(d.skills)).catch(() => {});
  }, [token]);

  function addSkill(e) {
    e.preventDefault();
    if (!skillName.trim()) return;
    if (skills.some((s) => s.skillName.toLowerCase() === skillName.trim().toLowerCase())) return;
    setSkills((s) => [...s, { skillName: skillName.trim(), level: Number(level) }]);
    setSkillName("");
    setLevel(3);
  }

  function removeSkill(name) {
    setSkills((s) => s.filter((sk) => sk.skillName !== name));
  }

  async function saveAll() {
    setSaving(true);
    setSavedMsg("");
    await api.updateProfile(token, { branch, year });
    await api.updateSkills(token, skills);
    await onUpdated();
    setSaving(false);
    setSavedMsg("Saved — your matches have been recalculated.");
    setTimeout(() => setSavedMsg(""), 3000);
  }

  return (
    <div className="two-col">
      <div>
        <div className="panel">
          <div className="panel-title">Academic details</div>
          <div className="field-row">
            <div className="field">
              <label>Branch</label>
              <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="e.g. Computer Science" />
            </div>
            <div className="field">
              <label>Year</label>
              <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 3" />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Add a skill</div>
          <div className="panel-sub">Rate yourself honestly — this drives the match scores you'll see.</div>
          <form onSubmit={addSkill}>
            <div className="field-row" style={{ alignItems: "flex-end" }}>
              <div className="field" style={{ flex: 2 }}>
                <label>Skill</label>
                <input
                  list="skill-options"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="Start typing… e.g. React"
                />
                <datalist id="skill-options">
                  {master.map((m) => <option key={m} value={m} />)}
                </datalist>
              </div>
              <div className="field">
                <label>Level</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)}>
                  {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>{l} — {LEVEL_LABELS[l]}</option>)}
                </select>
              </div>
              <div className="field" style={{ flexShrink: 0 }}>
                <button className="btn btn-primary" type="submit">Add</button>
              </div>
            </div>
          </form>

          {skills.length === 0 ? (
            <EmptyState glyph="◐" title="No skills added yet" hint="Add at least 3-5 skills for accurate matching." />
          ) : (
            <div style={{ marginTop: 6 }}>
              {skills.map((s) => (
                <SkillBar key={s.skillName} name={s.skillName} level={s.level} />
              ))}
            </div>
          )}

          <div className="chip-row" style={{ marginTop: 14 }}>
            {skills.map((s) => (
              <div className="chip" key={s.skillName}>
                {s.skillName}
                <button onClick={() => removeSkill(s.skillName)} aria-label={`Remove ${s.skillName}`}>×</button>
              </div>
            ))}
          </div>

          {savedMsg && <div className="success-banner" style={{ marginTop: 16 }}>{savedMsg}</div>}
          <button className="btn btn-accent" style={{ marginTop: 16 }} onClick={saveAll} disabled={saving}>
            {saving ? "Saving…" : "Save profile & skills"}
          </button>
        </div>
      </div>

      <div className="panel" style={{ height: "fit-content" }}>
        <div className="panel-title">Why levels matter</div>
        <div className="panel-sub" style={{ marginBottom: 0 }}>
          Each opportunity lists a required proficiency level per skill (1–5).
          Our engine compares your level against that requirement — meeting or
          exceeding it earns full credit, and falling short earns partial
          credit proportional to the gap. That's what powers every match
          score you see across the portal.
        </div>
      </div>
    </div>
  );
}

function Browse({ token, opportunities, onApplied }) {
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [message, setMessage] = useState("");

  async function toggleDetail(id) {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    const d = await api.opportunity(token, id);
    setDetail(d);
  }

  async function apply(id) {
    setApplyingId(id);
    setMessage("");
    try {
      await api.apply(token, id);
      setMessage("Application submitted!");
      await onApplied();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setApplyingId(null);
    }
  }

  if (opportunities.length === 0) {
    return <EmptyState glyph="◇" title="No open opportunities right now" hint="Check back soon — industry partners post new roles regularly." />;
  }

  return (
    <div>
      {message && <div className="success-banner">{message}</div>}
      <div className="card-grid">
        {[...opportunities].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).map((o) => (
          <div className="opp-card" key={o.id}>
            <div className="top-row">
              <div>
                <div className="company">{o.companyName}</div>
                <div className="title">{o.title}</div>
              </div>
              <MatchBadge score={o.matchScore || 0} />
            </div>
            <div className="meta">
              <span style={{ textTransform: "capitalize" }}>{o.type}</span>
              <span>·</span>
              <span>{o.location || "Location flexible"}</span>
              {o.stipend && <><span>·</span><span>{o.stipend}</span></>}
            </div>
            <div className="skills">
              {o.requiredSkills.map((s) => (
                <span key={s.skillName} className="skill-tag">{s.skillName} · L{s.level}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => toggleDetail(o.id)}>
                {expanded === o.id ? "Hide gap analysis" : "See gap analysis"}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => apply(o.id)} disabled={applyingId === o.id}>
                {applyingId === o.id ? "Applying…" : "Apply"}
              </button>
            </div>

            {expanded === o.id && detail && detail.opportunity.id === o.id && (
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 4 }}>
                {detail.match.gaps.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--success)", fontWeight: 600 }}>
                    You meet every required skill for this role.
                  </div>
                ) : (
                  <div className="gap-list">
                    {detail.match.gaps.map((g) => (
                      <div className="gap-item" key={g.skillName}>
                        <span>{g.skillName} — you're at {g.currentLevel}, role needs {g.requiredLevel}</span>
                        <span className="close">+{g.levelsToClose}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Applications({ applications }) {
  if (applications.length === 0) {
    return <EmptyState glyph="◆" title="You haven't applied to anything yet" hint="Browse opportunities and apply — it takes one click." />;
  }
  return (
    <div className="panel">
      <table>
        <thead>
          <tr><th>Opportunity</th><th>Company</th><th>Match</th><th>Status</th><th>Applied</th></tr>
        </thead>
        <tbody>
          {applications.map((a) => (
            <tr key={a.id}>
              <td>{a.opportunity?.title || "—"}</td>
              <td>{a.opportunity?.companyName || "—"}</td>
              <td><MatchBadge score={a.matchScore} /></td>
              <td><StatusPill status={a.status} /></td>
              <td>{new Date(a.appliedAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Certificates({ token }) {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [issuerName, setIssuerName] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const data = await api.myCertificates(token, "me");
    setCerts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function submit(e) {
    e.preventDefault();
    if (!courseName.trim() || !issuerName.trim()) return;
    setSubmitting(true);
    setMessage("");
    const formData = new FormData();
    formData.append("studentId", "me");
    formData.append("courseName", courseName);
    formData.append("issuerName", issuerName);
    if (file) formData.append("certFile", file);

    try {
      await api.submitExternalCertificate(token, formData);
      setMessage("Certificate submitted for review.");
      setCourseName("");
      setIssuerName("");
      setFile(null);
      await load();
    } catch (err) {
      setMessage("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="two-col">
      <div>
        <div className="panel">
          <div className="panel-title">Submit an external certificate</div>
          <div className="panel-sub">
            Completed a course outside college (Coursera, NPTEL, Udemy, etc.)?
            Upload it here for verification by your college.
          </div>
          <form onSubmit={submit}>
            <div className="field-row">
              <div className="field">
                <label>Course name</label>
                <input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g. C Programming" />
              </div>
              <div className="field">
                <label>Issued by</label>
                <input value={issuerName} onChange={(e) => setIssuerName(e.target.value)} placeholder="e.g. NPTEL" />
              </div>
            </div>
            <div className="field">
              <label>Certificate file (optional)</label>
              <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ marginTop: 12 }}>
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          </form>
          {message && <div className="success-banner" style={{ marginTop: 16 }}>{message}</div>}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Your certificates</div>
        {loading ? (
          <div className="loading-line">Loading…</div>
        ) : certs.length === 0 ? (
          <EmptyState glyph="★" title="No certificates yet" hint="Submit one using the form, or ask your college to issue one." />
        ) : (
          <table>
            <thead>
              <tr><th>Course</th><th>Source</th><th>Status</th></tr>
            </thead>
            <tbody>
              {certs.map((c) => (
                <tr key={c.certId}>
                  <td>{c.courseName}</td>
                  <td style={{ textTransform: "capitalize" }}>{c.source}</td>
                  <td><StatusPill status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Recommendations({ token }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await api.myRecommendations(token);
    setRecs(data.recommendations);
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  return (
    <div className="panel">
      <div className="panel-title">Skills worth learning next</div>
      <div className="panel-sub">
        Based on how often each skill appears in open opportunities you don't
        currently have — the higher the demand, the higher the priority.
      </div>
      {loading ? (
        <div className="loading-line">Loading…</div>
      ) : recs.length === 0 ? (
        <EmptyState glyph="▲" title="No recommendations right now" hint="You already have the top skills employers are asking for, or there are no open opportunities yet." />
      ) : (
        <table>
          <thead>
            <tr><th>Skill</th><th>Requested by</th></tr>
          </thead>
          <tbody>
            {recs.map((r) => (
              <tr key={r.skillName}>
                <td>{r.skillName}</td>
                <td>{r.opportunityCount} open opportunit{r.opportunityCount === 1 ? "y" : "ies"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ResumeBuilder({ token }) {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await api.myResume(token);
    setResume(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  if (loading) return <div className="loading-line">Loading…</div>;
  if (!resume) return <EmptyState glyph="▤" title="Could not load resume" />;

  return (
    <div className="panel">
      <div className="panel-title">{resume.name}</div>
      <div className="panel-sub">{resume.email} · {resume.branch}, Year {resume.year}</div>

      <h3 style={{ marginTop: 20 }}>Skills</h3>
      {resume.skills.length === 0 ? (
        <EmptyState glyph="◐" title="No skills added yet" />
      ) : (
        <div className="chip-row">
          {resume.skills.map((s) => (
            <div className="chip" key={s.skillName}>{s.skillName} — L{s.level}</div>
          ))}
        </div>
      )}

      <h3 style={{ marginTop: 20 }}>Certificates</h3>
      {resume.certificates.length === 0 ? (
        <EmptyState glyph="★" title="No certificates yet" />
      ) : (
        <ul>
          {resume.certificates.map((c) => (
            <li key={c.certId}>{c.courseName} — {c.status}</li>
          ))}
        </ul>
      )}

      <h3 style={{ marginTop: 20 }}>Applications</h3>
      {resume.applications.length === 0 ? (
        <EmptyState glyph="◆" title="No applications yet" />
      ) : (
        <ul>
          {resume.applications.map((a) => (
            <li key={a.id}>{a.opportunity?.title || "—"} — {a.status}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CareerRoadmap({ token }) {
  const [catalog, setCatalog] = useState([]);
  const [disclaimer, setDisclaimer] = useState("");
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [cat, mine] = await Promise.all([api.careerCatalog(token), api.myCareer(token)]);
    setCatalog(cat.catalog);
    setDisclaimer(cat.disclaimer);
    setCurrent(mine.roadmap);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []); // eslint-disable-line

  async function pick(careerKey) {
    setSwitching(true);
    const data = await api.selectCareer(token, careerKey);
    setCurrent(data.roadmap);
    await loadAll();
    setSwitching(false);
  }

  if (loading) return <div className="loading-line">Loading your career options…</div>;

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Which careers fit you right now?</div>
        <div className="panel-sub">{disclaimer}</div>
        <div className="stat-row" style={{ marginTop: 14 }}>
          {catalog.map((c) => (
            <div key={c.key} className="stat-card" style={{ border: c.selected ? "2px solid var(--accent, #2f5bea)" : undefined }}>
              <div className="num">{c.fitScore}%</div>
              <div className="label">{c.label}</div>
              <div style={{ fontSize: 12.5, color: "#5B6579", margin: "6px 0 10px" }}>{c.description}</div>
              <button
                className={`btn btn-sm ${c.selected ? "btn-accent" : "btn-ghost"}`}
                disabled={switching}
                onClick={() => pick(c.key)}
              >
                {c.selected ? "Selected" : switching ? "Switching…" : "Choose this"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {current && (
        <div className="panel" style={{ marginTop: 20 }}>
          <div className="panel-title">Your roadmap — {current.label}</div>
          <div className="panel-sub">
            Readiness: <b>{current.readiness}%</b>
            {current.nextStep && <> · Next up: <b>{current.nextStep.skillName}</b></>}
          </div>
          <table style={{ marginTop: 14 }}>
            <thead>
              <tr><th>Skill</th><th>Your level</th><th>Target</th><th>Status</th></tr>
            </thead>
            <tbody>
              {current.steps.map((s) => (
                <tr key={s.skillName}>
                  <td>{s.skillName}</td>
                  <td>L{s.currentLevel}</td>
                  <td>L{s.requiredLevel}</td>
                  <td><StatusPill status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const DAY_OPTIONS = [
  { key: "MO", label: "Mon" }, { key: "TU", label: "Tue" }, { key: "WE", label: "Wed" },
  { key: "TH", label: "Thu" }, { key: "FR", label: "Fri" }, { key: "SA", label: "Sat" }, { key: "SU", label: "Sun" },
];

function AcademicPlanner({ token }) {
  const [slots, setSlots] = useState([]);
  const [plan, setPlan] = useState({ tasks: [], note: "" });
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ day: "MO", start: "18:00", end: "19:00" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const data = await api.myPlan(token);
    setSlots(data.freeTimeSlots);
    setPlan(data.plan);
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function saveSlots(next) {
    setSaving(true);
    setError("");
    try {
      const data = await api.savePlannerSlots(token, next);
      setSlots(data.freeTimeSlots);
      setPlan(data.plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function addSlot() {
    saveSlots([...slots, draft]);
  }

  function removeSlot(i) {
    saveSlots(slots.filter((_, idx) => idx !== i));
  }

  if (loading) return <div className="loading-line">Building your plan…</div>;

  return (
    <div className="two-col">
      <div className="panel">
        <div className="panel-title">Your free time this week</div>
        <div className="panel-sub">Tell us when you're actually free — classes and personal time stay untouched.</div>
        {error && <div className="error-banner">{error}</div>}
        <div className="field-row" style={{ marginTop: 10 }}>
          <div className="field">
            <label>Day</label>
            <select value={draft.day} onChange={(e) => setDraft((d) => ({ ...d, day: e.target.value }))}>
              {DAY_OPTIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Start</label>
            <input type="time" value={draft.start} onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))} />
          </div>
          <div className="field">
            <label>End</label>
            <input type="time" value={draft.end} onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))} />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" disabled={saving} onClick={addSlot}>
          {saving ? "Saving…" : "Add slot"}
        </button>

        {slots.length > 0 && (
          <div className="chip-row" style={{ marginTop: 14 }}>
            {slots.map((s, i) => (
              <span key={i} className="chip">
                {DAY_OPTIONS.find((d) => d.key === s.day)?.label} {s.start}–{s.end}
                <button type="button" onClick={() => removeSlot(i)}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-title">This week's plan</div>
        <div className="panel-sub">{plan.note}</div>
        {plan.tasks.length === 0 ? (
          <EmptyState glyph="▦" title="No plan yet" hint="Add a free-time slot to generate your first task." />
        ) : (
          <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
            {plan.tasks.map((t, i) => (
              <li key={i}>
                <b>{t.dayLabel} {t.start}–{t.end}:</b> {t.task}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ProjectMentor({ token }) {
  const [careerKey, setCareerKey] = useState("");
  const [level, setLevel] = useState("");
  const [teamSize, setTeamSize] = useState("individual");
  const [catalog, setCatalog] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.careerCatalog(token).then((d) => setCatalog(d.catalog)).catch(() => {});
    api.mentorHistory(token).then((d) => setHistory(d.suggestions)).catch(() => {});
  }, [token]);

  async function suggest() {
    setBusy(true);
    setError("");
    try {
      const data = await api.suggestProject(token, {
        careerKey: careerKey || undefined,
        level: level || undefined,
        teamSize,
      });
      setSuggestion(data.suggestion);
      setExplanation(data.explanation);
      const h = await api.mentorHistory(token);
      setHistory(h.suggestions);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Tell the mentor what you want to build</div>
        <div className="panel-sub">
          Suggestions are rule-based on your career track and skill level — think of it as a curated
          template picker, not a general-purpose chatbot.
        </div>
        {error && <div className="error-banner">{error}</div>}
        <div className="field-row" style={{ marginTop: 10 }}>
          <div className="field">
            <label>Career track</label>
            <select value={careerKey} onChange={(e) => setCareerKey(e.target.value)}>
              <option value="">Use my selected career goal</option>
              {catalog.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Infer from my readiness</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="field">
            <label>Team</label>
            <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
              <option value="individual">Individual</option>
              <option value="team">Team project</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" disabled={busy} onClick={suggest}>
          {busy ? "Thinking…" : "Suggest a project"}
        </button>
      </div>

      {suggestion && (
        <div className="panel" style={{ marginTop: 20 }}>
          <div className="panel-title">{suggestion.title}</div>
          <div className="panel-sub">{explanation}</div>
          <h4 style={{ marginTop: 14 }}>Tech stack</h4>
          <div className="chip-row">{suggestion.stack.map((s) => <span className="chip" key={s}>{s}</span>)}</div>
          <h4 style={{ marginTop: 14 }}>Phases</h4>
          <ol style={{ lineHeight: 1.8 }}>{suggestion.phases.map((p, i) => <li key={i}>{p}</li>)}</ol>
          <h4 style={{ marginTop: 14 }}>Resources</h4>
          <ul style={{ lineHeight: 1.8 }}>{suggestion.resources.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
      )}

      {history.length > 0 && (
        <div className="panel" style={{ marginTop: 20 }}>
          <div className="panel-title">Past suggestions</div>
          <ul style={{ lineHeight: 1.9, marginTop: 8 }}>
            {history.map((h) => (
              <li key={h.id}>{h.title} — {h.careerLabel} · {h.level}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
