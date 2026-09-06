import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { timeAgo } from "./Bits";

const ROLE_LABEL = {
  student: "Student",
  industry: "Industry Partner",
  college: "Training & Placement Cell",
  admin: "Nodal Admin",
};

export default function DashboardLayout({ navItems, activeTab, onTabChange, children }) {
  const { user, token, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .notifications(token)
      .then((d) => !cancelled && setNotifications(d.notifications))
      .catch(() => {});
    const interval = setInterval(() => {
      api.notifications(token).then((d) => !cancelled && setNotifications(d.notifications)).catch(() => {});
    }, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  const unread = notifications.filter((n) => !n.read).length;

  async function openNotifications() {
    setNotifOpen((v) => !v);
    if (!notifOpen && unread > 0) {
      await api.markAllRead(token);
      setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="mark">S</div>
          <div>
            <div className="name">Setu</div>
            <div className="sub">SIH26044 · Skill Portal</div>
          </div>
        </div>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-link ${activeTab === item.key ? "active" : ""}`}
              onClick={() => onTabChange(item.key)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="who-am-i">
            <div>{user?.name}</div>
            <div className="org">{ROLE_LABEL[user?.role] || ""}{user?.orgName ? ` · ${user.orgName}` : ""}</div>
          </div>
          <button className="nav-link" onClick={logout}>
            <span>⎋</span> <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div style={{ fontWeight: 600, color: "var(--ink)" }}>
            {navItems.find((n) => n.key === activeTab)?.label}
          </div>
          <div style={{ position: "relative" }}>
            <button className="bell-btn" onClick={openNotifications} aria-label="Notifications">
              🔔
              {unread > 0 && <span className="bell-dot" />}
            </button>
            {notifOpen && (
              <div className="notif-dropdown">
                {notifications.length === 0 ? (
                  <div style={{ padding: 20, color: "var(--text-muted)", fontSize: 13.5 }}>
                    No notifications yet.
                  </div>
                ) : (
                  <div className="notif-list">
                    {notifications.map((n) => (
                      <div key={n.id} className={`notif-item ${n.read ? "" : "unread"}`}>
                        <div className="notif-dot" style={{ opacity: n.read ? 0 : 1 }} />
                        <div>
                          <div>{n.message}</div>
                          <div className="notif-time">{timeAgo(n.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
