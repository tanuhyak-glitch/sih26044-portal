// utils/oauth.js
// Minimal OAuth2 "authorization code" flow for Google, GitHub, and
// LinkedIn — no passport dependency needed. Each provider config knows
// how to build its authorize URL, exchange a code for an access token,
// and fetch a normalised profile { providerId, name, email }.
//
// Client IDs/secrets come from environment variables only — see
// backend/.env.example. A provider is simply unavailable (button hidden/
// disabled on the frontend) until its env vars are set.

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

function callbackUrl(provider) {
  return `${BACKEND_URL}/api/auth/oauth/${provider}/callback`;
}

const PROVIDERS = {
  google: {
    enabled: () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    authorizeUrl(state) {
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: callbackUrl("google"),
        response_type: "code",
        scope: "openid email profile",
        state,
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    },
    async exchange(code) {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: callbackUrl("google"),
          grant_type: "authorization_code",
          code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || "Google token exchange failed.");
      return data.access_token;
    },
    async profile(accessToken) {
      const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      return { providerId: data.id, name: data.name, email: data.email };
    },
  },

  github: {
    enabled: () => Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    authorizeUrl(state) {
      const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: callbackUrl("github"),
        scope: "read:user user:email",
        state,
      });
      return `https://github.com/login/oauth/authorize?${params}`;
    },
    async exchange(code) {
      const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: new URLSearchParams({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          redirect_uri: callbackUrl("github"),
          code,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error_description || "GitHub token exchange failed.");
      return data.access_token;
    },
    async profile(accessToken) {
      const headers = { Authorization: `Bearer ${accessToken}`, "User-Agent": "sih26044-portal" };
      const userRes = await fetch("https://api.github.com/user", { headers });
      const user = await userRes.json();
      let email = user.email;
      if (!email) {
        const emailsRes = await fetch("https://api.github.com/user/emails", { headers });
        const emails = await emailsRes.json();
        const primary = Array.isArray(emails) ? emails.find((e) => e.primary) || emails[0] : null;
        email = primary ? primary.email : `${user.login}@users.noreply.github.com`;
      }
      return { providerId: String(user.id), name: user.name || user.login, email, githubUrl: user.html_url };
    },
  },

  linkedin: {
    enabled: () => Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
    authorizeUrl(state) {
      const params = new URLSearchParams({
        client_id: process.env.LINKEDIN_CLIENT_ID,
        redirect_uri: callbackUrl("linkedin"),
        response_type: "code",
        scope: "openid profile email",
        state,
      });
      return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
    },
    async exchange(code) {
      const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
          redirect_uri: callbackUrl("linkedin"),
          grant_type: "authorization_code",
          code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || "LinkedIn token exchange failed.");
      return data.access_token;
    },
    async profile(accessToken) {
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      return { providerId: data.sub, name: data.name, email: data.email, linkedinUrl: null };
    },
  },
};

module.exports = { PROVIDERS };
