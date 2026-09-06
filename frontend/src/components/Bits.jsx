export function MatchBadge({ score }) {
  const cls = score >= 75 ? "match-high" : score >= 45 ? "match-mid" : "match-low";
  return <span className={`match-badge ${cls}`}>{score}%</span>;
}

export function StatusPill({ status }) {
  return <span className={`pill pill-${status}`}>{status}</span>;
}

export function SkillBar({ name, level, max = 5, gap = false }) {
  return (
    <div className="skill-row">
      <div className="skill-name">{name}</div>
      <div className="skill-track">
        <div
          className={`skill-fill ${gap ? "gap-fill" : ""}`}
          style={{ width: `${(level / max) * 100}%` }}
        />
      </div>
      <div className="skill-level-num">{level}</div>
    </div>
  );
}

export function EmptyState({ glyph = "—", title, hint }) {
  return (
    <div className="empty-state">
      <div className="glyph">{glyph}</div>
      <div style={{ fontWeight: 600, color: "var(--ink)" }}>{title}</div>
      {hint && <div style={{ marginTop: 4, fontSize: 13 }}>{hint}</div>}
    </div>
  );
}

export function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
