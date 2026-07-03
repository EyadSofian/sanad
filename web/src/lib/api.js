/** API client — all server calls go through here (JWT + SSE parsing). */

const TOKEN_KEY = 'sanad_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `HTTP ${res.status}`, data);
  return data;
}

export const AuthAPI = {
  signup: (payload) => api('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => api('/auth/login', { method: 'POST', body: payload }),
};

export const SessionsAPI = {
  list: () => api('/sessions'),
  messages: (id) => api(`/sessions/${id}/messages`),
};

export const SettingsAPI = {
  get: () => api('/settings'),
  patch: (payload) => api('/settings', { method: 'PATCH', body: payload }),
};

export const MemoryAPI = {
  list: () => api('/me/memory'),
  remove: (id) => api(`/me/memory/${id}`, { method: 'DELETE' }),
};

export const MeAPI = {
  deleteAccount: () => api('/me', { method: 'DELETE' }),
};

export const DigestAPI = {
  latest: () => api('/digest/latest'),
};

/**
 * TTS for one assistant message (spec Section 9).
 * @returns {{audio: Blob}|{fallback: true}} — fallback means: use browser speechSynthesis.
 */
export async function fetchSpeech(messageId) {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ messageId }),
  });
  if (res.ok) return { audio: await res.blob() };
  const data = await res.json().catch(() => ({}));
  if (data.fallback === 'browser') return { fallback: true };
  throw new ApiError(res.status, data.error || 'tts failed', data);
}

/**
 * POST /api/chat and parse the SSE stream.
 * @param {object} o
 * @param {string} [o.text]
 * @param {Blob}   [o.audio]  webm/opus voice note
 * @param {string} [o.sessionId]
 * @param {(event: string, data: any) => void} o.onEvent  meta | crisis_resources | delta | done | error
 * @param {AbortSignal} [o.signal]
 */
export async function streamChat({ text, audio, sessionId, onEvent, signal }) {
  let body;
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (audio) {
    body = new FormData();
    body.append('audio', audio, 'voice.webm');
    if (sessionId) body.append('sessionId', sessionId);
    if (text) body.append('text', text);
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({ text, sessionId });
  }

  const res = await fetch('/api/chat', { method: 'POST', headers, body, signal });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error || 'chat failed', data);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      let event = 'message';
      let data = null;
      for (const line of block.split('\n')) {
        if (line.startsWith('event: ')) event = line.slice(7).trim();
        else if (line.startsWith('data: ')) {
          try {
            data = JSON.parse(line.slice(6));
          } catch {
            data = null;
          }
        }
      }
      if (data !== null) onEvent(event, data);
    }
  }
}
