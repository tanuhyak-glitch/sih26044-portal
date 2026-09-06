import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import { EmptyState } from "../../components/Bits";

const NAV = [
  { key: "overview", label: "Platform Overview", icon: "◈" },
  { key: "heatmap", label: "National Skill Map", icon: "▤" },
  { key: "gaps", label: "Demand vs Supply", icon: "△" },
  { key: "funnel", label: "Applications Funnel", icon: "◆" },
];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminAnalytics(token).then((d) => { setData(d); setLoading(false); });
  }, []); // eslint-disable-line

  return (
    <DashboardLayout navItems={NAV} activeTab={tab} onTabChange={setTab}>
      <div className="page-head">
        <div className="eyebrow">Nodal admin workspace</div>
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
        <Funnel rows={data.applicationsByStatus} />
      )}
    </DashboardLayout>
  );
}

function Overview({ totals }) {
  return (
    <div className="stat-row">
      <div className="stat-hero">
        <div>
          <div className="num">{totals.placed}</div>
          <div className="label">Students placed platform-wide</div>
        </div>
      </div>
      <div className="stat-card"><div className="num">{totals.students}</div><div className="label">Students onboarded</div></div>
      <div className="stat-card"><div className="num">{totals.colleges}</div><div className="label">Colleges connected</div></div>
      <div className="stat-card"><div className="num">{totals.industries}</div><div className="label">Industry partners</div></div>
      <div className="stat-card" style={{ gridColumn: "span 2" }}><div className="num">{totals.openOpportunities}</div><div className="label">Open opportunities right now</div></div>
      <div className="stat-card" style={{ gridColumn: "span 2" }}><div className="num">{totals.totalApplications}</div><div className="label">Total applications submitted</div></div>
    </div>
  );
}

function Heatmap({ heatmap }) {
  if (!heatmap || heatmap.length === 0) {
    return <EmptyState glyph="▤" title="No skill data yet" />;
  }
  return (
    <div className="panel">
      <div className="panel-title">Most common student skills, nationally</div>
      <div className="panel-sub">Aggregated across every college on the platform.</div>
      <div style={{ width: "100%", height: Math.max(280, heatmap.length * 34) }}>
        <ResponsiveContainer>
          <BarChart data={heatmap} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#DDE2EC" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="skillName" width={160} tick={{ fontSize: 12.5 }} />
            <Tooltip />
            <Bar dataKey="studentsWithSkill" fill="#16305C" radius={[0, 4, 4, 0]} name="Students" />
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
      <div className="panel-title">National skill gaps</div>
      <div className="panel-sub">Skills that industry is asking for more than students currently have — useful for shaping curriculum policy.</div>
      {gapRows.length === 0 ? (
        <EmptyState glyph="△" title="No major gaps detected" />
      ) : (
        <table>
          <thead><tr><th>Skill</th><th>Demand</th><th>Supply</th><th>Gap</th></tr></thead>
          <tbody>
            {gapRows.map((r) => (
              <tr key={r.skillName}>
                <td>{r.skillName}</td>
                <td>{r.demandCount}</td>
                <td>{r.supplyCount}</td>
                <td style={{ color: "var(--danger)", fontWeight: 700 }}>+{r.gap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Funnel({ rows }) {
  const labels = { applied: "Applied", shortlisted: "Shortlisted", selected: "Selected", rejected: "Rejected" };
  const chartData = (rows || []).map((r) => ({ name: labels[r.status] || r.status, count: r.count }));
  return (
    <div className="panel">
      <div className="panel-title">Where applications stand, platform-wide</div>
      <div className="panel-sub">A healthy funnel narrows gradually — a steep drop from Applied to Shortlisted usually points to a skills mismatch worth investigating.</div>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDE2EC" />
            <XAxis dataKey="name" tick={{ fontSize: 12.5 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#D9A62E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
