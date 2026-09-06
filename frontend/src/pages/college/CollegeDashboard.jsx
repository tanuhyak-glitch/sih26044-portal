import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import { EmptyState } from "../../components/Bits";

const NAV = [
  { key: "overview", label: "Overview", icon: "◈" },
  { key: "heatmap", label: "Skill Heatmap", icon: "▤" },
  { key: "gaps", label: "Demand vs Supply", icon: "△" },
  { key: "roster", label: "Student Roster", icon: "◇" },
];

export default function CollegeDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.collegeAnalytics(token), api.roster(token)]).then(([a, r]) => {
      setData(a);
      setStudents(r.students);
      setLoading(false);
    });
  }, []); // eslint-disable-line

  return (
    <DashboardLayout navItems={NAV} activeTab={tab} onTabChange={setTab}>
      <div className="page-head">
        <div className="eyebrow">Training & Placement workspace</div>
        <h1>{NAV.find((n) => n.key === tab)?.label}</h1>
      </div>

      {loading ? (
        <div className="loading-line">Loading…</div>
      ) : tab === "overview" ? (
        <Overview totals={data.totals} />
      ) : tab === "heatmap" ? (
        <Heatmap heatmap={data.skillHeatmap} />
      ) : tab === "gaps" ? (
        <Gaps rows={data.demandVsSupply} />
      ) : (
        <Roster students={students} />
      )}
    </DashboardLayout>
  );
}

function Overview({ totals }) {
  return (
    <div className="stat-row">
      <div className="stat-hero">
        <div>
          <div className="num">{totals.placementRate}%</div>
          <div className="label">Placement rate across your students</div>
        </div>
      </div>
      <div className="stat-card"><div className="num">{totals.students}</div><div className="label">Registered students</div></div>
      <div className="stat-card"><div className="num">{totals.shortlisted}</div><div className="label">Currently shortlisted</div></div>
      <div className="stat-card"><div className="num">{totals.placed}</div><div className="label">Placed / selected</div></div>
    </div>
  );
}

function Heatmap({ heatmap }) {
  if (!heatmap || heatmap.length === 0) {
    return <EmptyState glyph="▤" title="No skill data yet" hint="Once your students map their skills, this chart fills in automatically." />;
  }
  return (
    <div className="panel">
      <div className="panel-title">Skills your students actually have</div>
      <div className="panel-sub">Number of students who reported each skill, ranked by reach.</div>
      <div style={{ width: "100%", height: Math.max(280, heatmap.length * 34) }}>
        <ResponsiveContainer>
          <BarChart data={heatmap} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#DDE2EC" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="skillName" width={160} tick={{ fontSize: 12.5 }} />
            <Tooltip formatter={(v, n) => [v, n === "studentsWithSkill" ? "Students" : n]} />
            <Bar dataKey="studentsWithSkill" fill="#16305C" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Gaps({ rows }) {
  const gapRows = (rows || []).filter((r) => r.gap > 0);
  return (
    <div className="panel">
      <div className="panel-title">Where industry demand outpaces your students' supply</div>
      <div className="panel-sub">Counted across currently open opportunities vs. students' self-reported skills. Use this to prioritise training programmes.</div>
      {gapRows.length === 0 ? (
        <EmptyState glyph="△" title="No major gaps detected" hint="Your students' skills currently cover industry demand well." />
      ) : (
        <table>
          <thead><tr><th>Skill</th><th>Industry demand</th><th>Student supply</th><th>Gap</th></tr></thead>
          <tbody>
            {gapRows.map((r) => (
              <tr key={r.skillName}>
                <td>{r.skillName}</td>
                <td>{r.demandCount} posting(s)</td>
                <td>{r.supplyCount} student(s)</td>
                <td style={{ color: "var(--danger)", fontWeight: 700 }}>+{r.gap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Roster({ students }) {
  if (students.length === 0) {
    return <EmptyState glyph="◇" title="No students registered under your college yet" />;
  }
  return (
    <div className="panel">
      <table>
        <thead><tr><th>Name</th><th>Branch</th><th>Year</th><th>Skills mapped</th></tr></thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.name}<br /><span style={{ color: "var(--text-muted)", fontSize: 12 }}>{s.email}</span></td>
              <td>{s.branch || "—"}</td>
              <td>{s.year || "—"}</td>
              <td>{s.skills?.length || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
