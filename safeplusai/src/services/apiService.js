/**
 * API Service — centralized HTTP client for SafeplusAI backend
 * Base URL: http://localhost:5000/api
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const TOKEN_KEY = 'safeplusai_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(method, path, body, requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (requiresAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  // Only add body if it exists, as GET/HEAD requests will throw an error if body is present even if undefined
  if (body !== undefined && body !== null) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────────────
export const auth = {
  register: (payload) => request('POST', '/auth/register', payload, false),
  login:    (payload) => request('POST', '/auth/login', payload, false),
  me:       ()        => request('GET',  '/auth/me'),
  updateSettings: (s) => request('PATCH', '/auth/settings', s),
};

// ── Contacts ──────────────────────────────────────────────────────
export const contacts = {
  list:    ()             => request('GET',    '/contacts'),
  create:  (payload)      => request('POST',   '/contacts', payload),
  update:  (id, payload)  => request('PUT',    `/contacts/${id}`, payload),
  remove:  (id)           => request('DELETE', `/contacts/${id}`),
};

// ── Events ────────────────────────────────────────────────────────
export const events = {
  save:         (payload) => request('POST',  '/events', payload),
  list:         ()        => request('GET',   '/events'),
  stats:        ()        => request('GET',   '/events/stats'),
  updateStatus: (id, status) => request('PATCH', `/events/${id}/status`, { status }),
};

// ── Notify ────────────────────────────────────────────────────────
export const notify = {
  sos:  (payload)  => request('POST', '/notify/sos', payload),
  test: (phone)    => request('POST', '/notify/test', { phone }),
};

// ── Health ────────────────────────────────────────────────────────
export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}
