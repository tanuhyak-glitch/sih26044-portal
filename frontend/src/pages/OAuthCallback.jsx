import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

// The backend finishes a Google/GitHub/LinkedIn login by redirecting here
// with either #token=... or #error=... in the URL fragment (never a query
// param, so it never gets logged server-side or shared if the URL is copied
// before this page clears it).
export default function OAuthCallback() {
  const { onAuthSuccess } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace("#", ""));
    const token = hash.get("token");
    const err = hash.get("error");

    // Clear the sensitive fragment from the address bar immediately.
    window.history.replaceState(null, "", "/oauth-callback");

    if (err) {
      setError(err);
      return;
    }
    if (!token) {
      setError("Something went wrong signing you in. Please try again.");
      return;
    }

    api
      .me(token)
      .then((data) => {
        onAuthSuccess({ token, user: data.user });
        window.location.href = "/";
      })
      .catch(() => setError("Could not verify your session. Please try again."));
  }, [onAuthSuccess]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#5B6579" }}>
      {error ? (
        <>
          <div style={{ color: "#B3261E", fontWeight: 600 }}>{error}</div>
          <a href="/" style={{ color: "#0F2547" }}>Back to sign in</a>
        </>
      ) : (
        <div>Signing you in…</div>
      )}
    </div>
  );
}
