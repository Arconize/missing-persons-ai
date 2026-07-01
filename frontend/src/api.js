// Central API helper
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
  const res = await fetch(BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'خطای سرور');
  return data;
}

export const api = {
  // Auth
  register: (b)         => req('POST', '/auth/register', b),
  login:    (b)         => req('POST', '/auth/login', b),
  logout:   ()          => req('POST', '/auth/logout'),
  me:       ()          => req('GET',  '/auth/me'),

  // Persons (public)
  listPersons:  (p, status) => req('GET', `/persons/?page=${p}&limit=12${status?`&status=${status}`:''}`),
  getPerson:    (id)    => req('GET', `/persons/${id}`),
  searchPersons: (params) => {
    const qs = new URLSearchParams(Object.fromEntries(
      Object.entries(params).filter(([,v]) => v !== '' && v != null)
    )).toString();
    return req('GET', `/persons/search?${qs}`);
  },

  // Persons (auth)
  submitPerson: (fd)    => req('POST', '/persons/submit', fd, true),
  matchFace:    (fd)    => req('POST', '/persons/match-face', fd, true),

  // Admin
  adminStats:   ()      => req('GET',  '/admin/stats'),
  adminPending: (p)     => req('GET',  `/admin/pending?page=${p}`),
  approve:      (id)    => req('POST', `/admin/approve/${id}`),
  reject:       (id)    => req('POST', `/admin/reject/${id}`),
  deleteP:      (id)    => req('DELETE', `/admin/persons/${id}`),
  setStatus:    (id, s) => {
    const fd = new FormData(); fd.append('new_status', s);
    return req('PATCH', `/admin/persons/${id}/status`, fd, true);
  },
  adminUsers:   ()      => req('GET',  '/admin/users'),
  toggleUser:   (id)    => req('PATCH', `/admin/users/${id}/toggle`),
  setRole:      (id, r) => {
    const fd = new FormData(); fd.append('role', r);
    return req('PATCH', `/admin/users/${id}/role`, fd, true);
  },
};
