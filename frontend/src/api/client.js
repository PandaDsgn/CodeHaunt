const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, { method = "GET", body, form } = {}) {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload = body;
  if (form) {
    payload = new URLSearchParams(form);
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", form: { username: email, password } }),
  createParticipant: (data) => request("/auth/participants", { method: "POST", body: data }),
  listParticipants: () => request("/auth/participants"),
  disqualifyParticipant: (id) => request(`/auth/participants/${id}/disqualify`, { method: "POST" }),
  reinstateParticipant: (id) => request(`/auth/participants/${id}/reinstate`, { method: "POST" }),
  me: () => request("/auth/me"),
  disqualify: () => request("/auth/disqualify", { method: "POST" }),

  getEvent: () => request("/event"),
  setEvent: (starts_at) => request("/event", { method: "PUT", body: { starts_at } }),

  listQuestions: () => request("/questions"),
  getQuestion: (id) => request(`/questions/${id}`),
  createQuestion: (data) => request("/questions", { method: "POST", body: data }),
  updateQuestion: (id, data) => request(`/questions/${id}`, { method: "PUT", body: data }),
  setQuestionDeadline: (id, ends_at) =>
    request(`/questions/${id}/deadline`, { method: "PUT", body: { ends_at } }),
  deleteQuestion: (id) => request(`/questions/${id}`, { method: "DELETE" }),

  submit: (questionId, data) =>
    request(`/questions/${questionId}/submit`, { method: "POST", body: data }),
  mySubmissions: () => request("/submissions/mine"),
  allSubmissions: () => request("/submissions"),

  getChat: (questionId) => request(`/questions/${questionId}/ai-chat`),
  sendChat: (questionId, content) =>
    request(`/questions/${questionId}/ai-chat`, { method: "POST", body: { content } }),

  leaderboard: () => request("/leaderboard"),
};
