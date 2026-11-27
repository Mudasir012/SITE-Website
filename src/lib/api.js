export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

function reasonFrom(data, status) {
  const reason = data?.error?.message || data?.error || data?.message;
  if (typeof reason === 'string' && reason.trim()) return reason;
  return `Request failed (HTTP ${status}).`;
}

export async function apiFetch(path, { accessToken, ...options } = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('The email service is temporarily unavailable. Please try again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(reasonFrom(data, response.status));
  }

  return data;
}
