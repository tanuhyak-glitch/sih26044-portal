import { Fragment, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import { MatchBadge, StatusPill, EmptyState } from "../../components/Bits";

const NAV = [
  { key: "overview", label: "Overview", icon: "◈" },
  { key: "post", label: "Post Opportunity", icon: "✦" },
  { key: "postings", label: "My Postings", icon: "◇" },
  { key: "applicants", label: "Review Applicants", icon: "◆" },
];

export default function IndustryDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState("overview");
  const [postings, setPostings] = useState([]);
  const [master, setMaster] = useState([]);
  const [selectedOppId, setSelectedOppId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadPostings() {
    const d = await api.myOpportunities(token);
    setPostings(d.opportunities);
    return d.opportunities;
  }

  useEffect(() => {
    Promise.all([loadPostings(), api.skillsMaster(token)]).then(([opps, m]) => {
      setMaster(m.skills);
      if (opps.length > 0) setSelectedOppId(opps[0].id);
      setLoading(false);
    });
  }, []); // eslint-disable-line

  return (
    <DashboardLayout navItems={NAV} activeTab={tab} onTabChange={setTab}>
      <div className="page-head">
        <div className="eyebrow">Industry workspace</div>
        <h1>{NAV.find((n) => n.key === tab)?.label}</h1>
      </div>

      {loading ? (
        <div className="loading-line">Loading…</div>
      ) : tab === "overview" ? (
        <Overview postings={postings} onGo={setTab} />
      ) : tab === "post" ? (
        <PostForm token={token} master={master} onCreated={async () => { await loadPostings(); setTab("postings"); }} />
      ) : tab === "postings" ? (
        <Postings token={token} postings={postings} onChanged={loadPostings} onReview={(id) => { setSelectedOppId(id); setTab("applicants"); }} />
      ) : (
        <Applicants token={token} postings={postings} selectedOppId={selectedOppId} onSelect={setSelectedOppId} />
      )}
    </DashboardLayout>
  );
}

function Overview({ postings, onGo }) {
  const open = postings.filter((p) => p.status === "open").length;
  const totalSeats = postings.reduce((s, p) => s + Number(p.seats || 0), 0);

  return (
    <>
      <div className="stat-row">
        <div className="stat-hero">
          <div>
            <div className="num">{postings.length}</div>
            <div className="label">Total opportunities posted</div>
          </div>
          <button className="btn btn-accent btn-sm" style={{ marginTop: 14, width: "fit-content" }} onClick={() => onGo("post")}>
            Post a new opportunity
          </button>
        </div>
        <div className="stat-card"><div className="num">{open}</div><div className="label">Currently open</div></div>
        <div className="stat-card"><div className="num">{totalSeats}</div><div className="label">Total seats offered</div></div>
        <div className="stat-card"><div className="num">{postings.length - open}</div><div className="label">Closed</div></div>
      </div>

      <div className="panel">
        <div className="panel-title">Your postings</div>
        {postings.length === 0 ? (
          <EmptyState glyph="✦" title="You haven't posted anything yet" hint='Use "Post Opportunity" to publish your first internship or job.' />
        ) : (
          <table>
            <thead><tr><th>Title</th><th>Type</th><th>Seats</th><th>Status</th></tr></thead>
            <tbody>
              {postings.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td style={{ textTransform: "capitalize" }}>{p.type}</td>
                  <td>{p.seats}</td>
                  <td><span className={`pill pill-${p.status}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function PostForm({ token, master, onCreated }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("internship");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [stipend, setStipend] = useState("");
  const [seats, setSeats] = useState(1);
  const [skills, setSkills] = useState([{ skillName: "", level: 3 }]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateSkillRow(i, key, value) {
    setSkills((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }
  function addRow() { setSkills((rows) => [...rows, { skillName: "", level: 3 }]); }
  function removeRow(i) { setSkills((rows) => rows.filter((_, idx) => idx !== i)); }

  async function submit(e) {
    e.preventDefault();
    setError("");
    const cleanSkills = skills
      .filter((s) => s.skillName.trim())
      .map((s) => ({ skillName: s.skillName.trim(), level: Number(s.level) }));
    if (!title.trim() || cleanSkills.length === 0) {
      setError("Add a title and at least one required skill.");
      return;
    }
    setBusy(true);
    try {
      await api.createOpportunity(token, {
        title: title.trim(), type, description, location, stipend, seats: Number(seats), requiredSkills: cleanSkills,
      });
      setTitle(""); setDescription(""); setLocation(""); setStipend(""); setSeats(1);
      setSkills([{ skillName: "", level: 3 }]);
      await onCreated();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel" style={{ maxWidth: 700 }}>
      <div className="panel-title">New internship or job posting</div>
      <div className="panel-sub">Define required skills with a proficiency level — this is what drives applicant ranking.</div>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Frontend Engineering Intern" required />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="internship">Internship</option>
              <option value="job">Full-time job</option>
            </select>
          </div>
          <div className="field">
            <label>Seats</label>
            <input type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bengaluru (Hybrid)" />
          </div>
          <div className="field">
            <label>Stipend / CTC</label>
            <input value={stipend} onChange={(e) => setStipend(e.target.value)} placeholder="e.g. ₹15,000/month" />
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will they work on?" />
        </div>

        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>
          Required skills
        </label>
        {skills.map((row, i) => (
          <div className="field-row" key={i} style={{ alignItems: "flex-end" }}>
            <div className="field" style={{ flex: 2 }}>
              <input
                list="skill-master-list"
                value={row.skillName}
                onChange={(e) => updateSkillRow(i, "skillName", e.target.value)}
                placeholder="Skill name"
              />
            </div>
            <div className="field">
              <select value={row.level} onChange={(e) => updateSkillRow(i, "level", e.target.value)}>
                {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>Level {l}</option>)}
              </select>
            </div>
            <div className="field" style={{ flexShrink: 0 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeRow(i)} disabled={skills.length === 1}>
                Remove
              </button>
            </div>
          </div>
        ))}
        <datalist id="skill-master-list">{master.map((m) => <option key={m} value={m} />)}</datalist>
        <button type="button" className="btn btn-ghost btn-sm" onClick={addRow}>+ Add another skill</button>

        <div style={{ marginTop: 20 }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Publishing…" : "Publish opportunity"}</button>
        </div>
      </form>
    </div>
  );
}

function Postings({ token, postings, onChanged, onReview }) {
  async function toggleStatus(p) {
    const next = p.status === "open" ? "closed" : "open";
    await api.updateOpportunity(token, p.id, { status: next });
    await onChanged();
  }

  if (postings.length === 0) {
    return <EmptyState glyph="◇" title="No postings yet" />;
  }

  return (
    <div className="card-grid">
      {postings.map((p) => (
        <div className="opp-card" key={p.id}>
          <div className="top-row">
            <div>
              <div className="company">{p.type === "internship" ? "Internship" : "Full-time"}</div>
              <div className="title">{p.title}</div>
            </div>
            <span className={`pill pill-${p.status}`}>{p.status}</span>
          </div>
          <div className="meta"><span>{p.location || "Flexible"}</span><span>·</span><span>{p.seats} seat(s)</span></div>
          <div className="skills">
            {p.requiredSkills.map((s) => <span className="skill-tag" key={s.skillName}>{s.skillName} · L{s.level}</span>)}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
            <button className="btn btn-primary btn-sm" onClick={() => onReview(p.id)}>Review applicants</button>
            <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(p)}>
              {p.status === "open" ? "Close posting" : "Reopen"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Applicants({ token, postings, selectedOppId, onSelect }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  async function load(id) {
    if (!id) return;
    setLoading(true);
    const d = await api.applicantsFor(token, id);
    setApplicants(d.applicants);
    setLoading(false);
  }

  useEffect(() => { load(selectedOppId); }, [selectedOppId]); // eslint-disable-line

  async function setStatus(appId, status) {
    await api.setApplicationStatus(token, appId, status);
    await load(selectedOppId);
  }

  if (postings.length === 0) {
    return <EmptyState glyph="◆" title="Post an opportunity first to review applicants" />;
  }

  return (
    <div>
      <div className="field" style={{ maxWidth: 360, marginBottom: 20 }}>
        <label>Choose a posting</label>
        <select value={selectedOppId || ""} onChange={(e) => onSelect(Number(e.target.value))}>
          {postings.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-line">Loading applicants…</div>
      ) : applicants.length === 0 ? (
        <EmptyState glyph="◆" title="No applicants yet for this posting" />
      ) : (
        <div className="panel">
          <table>
            <thead>
              <tr><th>Candidate</th><th>Branch / Year</th><th>Match</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {applicants.map((a) => (
                <Fragment key={a.id}>
                  <tr>
                    <td>{a.studentName}<br /><span style={{ color: "var(--text-muted)", fontSize: 12 }}>{a.studentEmail}</span></td>
                    <td>{a.branch} {a.year ? `· Yr ${a.year}` : ""}</td>
                    <td><MatchBadge score={a.matchScore} /></td>
                    <td><StatusPill status={a.status} /></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                        {expanded === a.id ? "Hide" : "Details"}
                      </button>
                    </td>
                  </tr>
                  {expanded === a.id && (
                    <tr>
                      <td colSpan={5} style={{ background: "var(--paper)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: 220 }}>
                            {a.breakdown.map((b) => (
                              <div key={b.skillName} style={{ fontSize: 13, marginBottom: 4 }}>
                                {b.met ? "✓" : "△"} {b.skillName}: candidate L{b.studentLevel} / required L{b.required}
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setStatus(a.id, "shortlisted")}>Shortlist</button>
                            <button className="btn btn-accent btn-sm" onClick={() => setStatus(a.id, "selected")}>Select</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setStatus(a.id, "rejected")}>Reject</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
