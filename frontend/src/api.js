// Central API helper — FindMe v2.2
const BASE = 'https://whocareswashere-missing-persons-ai-backend.hf.space';

function headers(extra = {}) {
  const token = localStorage.getItem('token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function req(method, path, body, isForm = false) {
  const opts = {
    method,
    headers: isForm ? headers() : headers({ 'Content-Type': 'application/json' }),
    ...(body ? { body: isForm ? body : JSON.stringify(body) } : {}),
  };
  const res  = await fetch(BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'خطای سرور');
  return data;
}

export const api = {
  // ── Auth ──
  register: (b)  => req('POST', '/auth/register', b),
  login:    (b)  => req('POST', '/auth/login', b),
  logout:   ()   => req('POST', '/auth/logout'),
  me:       ()   => req('GET',  '/auth/me'),

  // ── Public persons ──
  listPersons:   (p, status) => req('GET', `/persons/?page=${p}&limit=12${status ? `&status=${status}` : ''}`),
  getPerson:     (id)        => req('GET', `/persons/${id}`),
  searchPersons: (params)    => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return req('GET', `/persons/search?${qs}`);
  },

  // ── Persons (auth required) ──
  submitPerson: (fd) => req('POST', '/persons/submit', fd, true),
  matchFace:    (fd) => req('POST', '/persons/match-face', fd, true),

  // ── My reports (logged-in user's submitted persons) ──
  myPersons: () => req('GET', '/my/persons'),

  // ── Found-reports (public filing) ──
  fileFoundReport: (personId, fd) => req('POST', `/persons/${personId}/found-reports`, fd, true),
  getFoundReports: (personId)     => req('GET',  `/persons/${personId}/found-reports`),

  // ── Found-report confirmation by original reporter ──
  confirmFoundReport: (reportId) => req('POST', `/found-reports/${reportId}/confirm`),
  rejectFoundReport:  (reportId) => req('POST', `/found-reports/${reportId}/reject`),

  // ── Admin: stats & pending submissions ──
  adminStats:   ()            => req('GET',  '/admin/stats'),
  adminPending: (p = 1)       => req('GET',  `/admin/pending?page=${p}`),
  approve:      (id)          => req('POST', `/admin/approve/${id}`),
  reject:       (id)          => req('POST', `/admin/reject/${id}`),

  // ── Admin: full persons management ──
  adminPersons: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return req('GET', `/admin/persons?${qs}`);
  },
  adminDeletePerson: (id)         => req('DELETE', `/admin/persons/${id}`),
  adminSetStatus:    (id, status) => {
    const fd = new FormData(); fd.append('new_status', status);
    return req('PATCH', `/admin/persons/${id}/status`, fd, true);
  },
  adminSetNotes: (id, notes) => {
    const fd = new FormData(); fd.append('notes', notes);
    return req('PATCH', `/admin/persons/${id}/notes`, fd, true);
  },

  // ── Admin: found-reports management ──
  adminFoundReports:       (p = 1, status = '') =>
    req('GET', `/admin/found-reports?page=${p}${status ? `&status=${status}` : ''}`),
  adminConfirmFoundReport: (id) => req('POST',   `/admin/found-reports/${id}/confirm`),
  adminRejectFoundReport:  (id) => req('POST',   `/admin/found-reports/${id}/reject`),
  adminDeleteFoundReport:  (id) => req('DELETE', `/admin/found-reports/${id}`),

  // ── Admin: users ──
  adminUsers:  ()         => req('GET',   '/admin/users'),
  toggleUser:  (id)       => req('PATCH', `/admin/users/${id}/toggle`),
  setRole:     (id, role) => {
    const fd = new FormData(); fd.append('role', role);
    return req('PATCH', `/admin/users/${id}/role`, fd, true);
  },
};
