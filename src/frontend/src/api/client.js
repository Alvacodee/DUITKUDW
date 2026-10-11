import { API_URL } from '../config';

export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.status = status;
    this.data   = data;
  }
}

// Wrapper fetch untuk API backend: base URL, header JSON & Authorization, parsing error.
// Selalu melempar ApiError (status 0 = server tidak bisa dihubungi).
export async function apiRequest(path, { method = 'GET', body, token, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Gagal menghubungi server.', 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Permintaan gagal (${res.status})`, res.status, data);
  return data;
}
