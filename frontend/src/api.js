const BASE = "/api";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error("Could not reach the server. Is the backend running on port 4000?");
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  registerStart: (body) => request("/auth/register/start", { method: "POST", body }),
  registerVerify: (body) => request("/auth/register/verify", { method: "POST", body }),
  registerResend: (email) => request("/auth/register/resend", { method: "POST", body: { email } }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  me: (token) => request("/auth/me", { token }),
  oauthProviders: () => request("/auth/oauth-providers"),
  oauthStartUrl: (provider, role) => `/api/auth/oauth/${provider}?role=${encodeURIComponent(role)}`,

  onboarding: (token) => request("/onboarding/me", { token }),
  saveOnboarding: (token, body) => request("/onboarding/me", { method: "PUT", token, body }),

  colleges: () => request("/meta/colleges"),
  skillsMaster: (token) => request("/students/skills-master", { token }),

  myProfile: (token) => request("/students/me", { token }),

  careerCatalog: (token) => request("/career/catalog", { token }),
  myCareer: (token) => request("/career/me", { token }),
  selectCareer: (token, careerKey) => request("/career/me", { method: "PUT", token, body: { careerKey } }),

  myPlan: (token) => request("/planner/me", { token }),
  savePlannerSlots: (token, slots) => request("/planner/me/slots", { method: "PUT", token, body: { slots } }),

  suggestProject: (token, body) => request("/project-mentor/suggest", { method: "POST", token, body }),
  mentorHistory: (token) => request("/project-mentor/history", { token }),
  updateProfile: (token, body) => request("/students/me", { method: "PUT", token, body }),
  updateSkills: (token, skills) => request("/students/me/skills", { method: "PUT", token, body: { skills } }),
  roster: (token) => request("/students", { token }),

  opportunities: (token) => request("/opportunities", { token }),
  opportunity: (token, id) => request(`/opportunities/${id}`, { token }),
  myOpportunities: (token) => request("/opportunities/mine", { token }),
  createOpportunity: (token, body) => request("/opportunities", { method: "POST", token, body }),
  updateOpportunity: (token, id, body) => request(`/opportunities/${id}`, { method: "PUT", token, body }),

  apply: (token, opportunityId) => request("/applications", { method: "POST", token, body: { opportunityId } }),
  myApplications: (token) => request("/applications/mine", { token }),
  applicantsFor: (token, opportunityId) => request(`/applications/opportunity/${opportunityId}`, { token }),
  setApplicationStatus: (token, id, status) =>
    request(`/applications/${id}/status`, { method: "PUT", token, body: { status } }),

  notifications: (token) => request("/notifications/mine", { token }),
  markNotificationRead: (token, id) => request(`/notifications/${id}/read`, { method: "PUT", token }),
  markAllRead: (token) => request("/notifications/read-all", { method: "PUT", token }),

  collegeAnalytics: (token) => request("/analytics/college", { token }),
  adminAnalytics: (token) => request("/analytics/admin", { token }),

  myCertificates: (token, studentId) => request(`/certificates/student/${studentId}`, { token }),
  submitExternalCertificate: (token, formData) =>
    fetch("/api/certificates/submit-external", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then((res) => res.json()),

  myRecommendations: (token) => request("/recommendations/me", { token }),
  myResume: (token) => request("/resume-builder/me", { token }),
};
