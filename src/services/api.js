const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method || "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  listListings: () => request("/listings"),
  getListing: (id) => request(`/listings/${id}`),
  updateListingStatus: (id, status) => request(`/listings/${id}`, { method: "PATCH", body: { status } }),

  listReports: () => request("/reports"),
  createReport: (data) => request("/reports", { method: "POST", body: data }),
  markReportSubmitted: (id) =>
    request(`/reports/${id}`, { method: "PATCH", body: { status: "submitted" } }),

  getConfig: () => request("/config"),
  saveConfig: (data) => request("/config", { method: "PUT", body: data }),

  scanNow: () => request("/scan", { method: "POST" }),
};
