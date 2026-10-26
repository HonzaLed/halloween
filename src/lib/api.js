// Shared by the control and organizer pages: key handling, POST helper, live state stream.
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};
export const key = (() => {
  const q = new URLSearchParams(location.search).get('key');
  if (q) store.set('runway_key', q);
  return q || store.get('runway_key') || '';
})();
const headers = () => ({ 'content-type': 'application/json', 'x-key': key });

export function askKey() {
  const k = prompt('Control key');
  if (k) { store.set('runway_key', k); location.href = location.pathname; }
}

export async function post(url, body, onOffline) {
  try {
    const r = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (r.status === 401) askKey();
    return r;
  } catch { onOffline?.(); }
}

/** Opens the live state stream. Resolves to the EventSource (call .close() to stop). */
export async function connectControl(onState, onStatus) {
  try {
    const r = await fetch('/api/ping', { headers: headers() });
    if (r.status === 401) return askKey();
  } catch {}
  const es = new EventSource('/events?role=control&key=' + encodeURIComponent(key));
  es.onopen = () => onStatus('Connected');
  es.onerror = () => onStatus('Reconnecting...');
  es.addEventListener('state', e => onState(JSON.parse(e.data)));
  return es;
}
