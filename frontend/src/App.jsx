import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { api } from "./api";
import AuthPage from "./pages/AuthPage";
import AuthCallback from "./pages/AuthCallback";
import OnboardingWizard from "./pages/student/OnboardingWizard";
import StudentDashboard from "./pages/student/StudentDashboard";
import IndustryDashboard from "./pages/industry/IndustryDashboard";
import CollegeDashboard from "./pages/college/CollegeDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

const DASHBOARD_BY_ROLE = {
  student: StudentDashboard,
  industry: IndustryDashboard,
  college: CollegeDashboard,
  admin: AdminDashboard,
};

function CenteredMessage({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#5B6579" }}>
      {children}
    </div>
  );
}

function AuthedApp() {
  const { user, token } = useAuth();
  const [onboarding, setOnboarding] = useState(null);
  const [loadingOnboarding, setLoadingOnboarding] = useState(user.role === "student");

  useEffect(() => {
    if (user.role !== "student") return;
    let cancelled = false;
    api
      .onboarding(token)
      .then((d) => !cancelled && setOnboarding(d.onboarding))
      .catch(() => !cancelled && setOnboarding({ onboardingComplete: true })) // fail open, don't block login
      .finally(() => !cancelled && setLoadingOnboarding(false));
    return () => {
      cancelled = true;
    };
  }, [user.role, token]);

  if (user.role === "student" && loadingOnboarding) {
    return <CenteredMessage>Loading your profile…</CenteredMessage>;
  }

  if (user.role === "student" && onboarding && !onboarding.onboardingComplete) {
    return <OnboardingWizard onComplete={(o) => setOnboarding(o)} />;
  }

  const Dashboard = DASHBOARD_BY_ROLE[user.role];
  return Dashboard ? <Dashboard /> : <Navigate to="/" />;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route path="/oauth/callback" element={<AuthCallback />} />
      <Route
        path="*"
        element={
          loading ? (
            <CenteredMessage>Loading Setu…</CenteredMessage>
          ) : !user ? (
            <AuthPage />
          ) : (
            <AuthedApp />
          )
        }
      />
    </Routes>
  );
}
