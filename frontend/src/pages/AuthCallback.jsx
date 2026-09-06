import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { onAuthSuccess } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");
    const err = params.get("error");
    if (err) {
      setError(err.replace(/_/g, " "));
      return;
    }
    if (!token) {
      setError("Missing sign-in token.");
      return;
    }
    api
      .me(token)
      .then((data) => {
        onAuthSuccess({ token, user: data.user });
        navigate("/", { replace: true });
      })
      .catch(() => setError("Could not complete sign-in. Please try again."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      {error ? (
        <>
          <div style={{ color: "var(--danger)", fontWeight: 600 }}>{error}</div>
          <button className="btn btn-primary" onClick={() => navigate("/", { replace: true })}>
            Back to login
          </button>
        </>
      ) : (
        <div style={{ color: "#5B6579" }}>Signing you in…</div>
      )}
    </div>
  );
}
