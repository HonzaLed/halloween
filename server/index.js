// Runway server: static pages (dist/), live events (SSE) and the JSON API. No runtime dependencies.
//   CONTROL_KEY=secret npm start        (PORT=8080 to change the port)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DATA = process.env.DATA_FILE || path.join(ROOT, 'data.json');
const PORT = process.env.PORT || 3000, KEY = process.env.CONTROL_KEY || '';

let state = { list: [], curId: null, live: null, hidden: false, board: false, nextId: 1 };
try { const d = JSON.parse(fs.readFileSync(DATA, 'utf8')); state.list = d.list || []; state.curId = d.curId ?? null; state.nextId = d.nextId || 1; } catch {}
const persist = () => fs.writeFile(DATA, JSON.stringify({ list: state.list, curId: state.curId, nextId: state.nextId }), () => {});

const clients = new Set();
const sse = (c, ev, d) => c.res.write(`event: ${ev}\ndata: ${JSON.stringify(d)}\n\n`);
const bcast = (ev, d, ctlOnly) => clients.forEach(c => { if (!ctlOnly || c.ctl) sse(c, ev, d); });
const snapshot = () => ({ list: state.list, cur: state.curId, live: state.live, hidden: state.hidden, board: state.board });
const pushState = () => bcast('state', snapshot(), true);
const authed = (req, u) => !KEY || req.headers['x-key'] === KEY || u.searchParams.get('key') === KEY;
const str = v => String(v ?? '').trim().slice(0, 100);
const byId = id => state.list.find(p => p.id === id);
const rows = () => state.list.map((p, i) => ({ ...p, i })).filter(p => p.score != null)
  .sort((a, b) => b.score - a.score || a.i - b.i).map(({ id, costume, real, cls, score }) => ({ id, costume, real, cls, score }));
const num = v => { if (v === null || v === '' || v === undefined) return null; const n = Number(v); return Number.isFinite(n) ? Math.round(Math.min(100, Math.max(0, n)) * 10) / 10 : undefined; };

const keyOf = p => [p.costume, p.real, p.cls].map(s => s.toLowerCase()).join('\u0001');
const sendRows = (id = -1, score = null) => bcast('cmd', { type: 'score', id, score, rows: rows() });
// Takes a removed participant off the air and out of the selection.
function forget(ids) {
  if (state.live && ids.has(state.live.id)) { state.live = null; state.hidden = false; bcast('cmd', { type: 'hide' }); }
  if (ids.has(state.curId)) state.curId = null;
}

const body = req => new Promise((res, rej) => {
  let b = ''; req.on('data', c => { b += c; if (b.length > 1e6) req.destroy(); });
  req.on('end', () => { try { res(JSON.parse(b || '{}')); } catch (e) { rej(e); } });
});

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const PAGES = { '/': 'control.html', '/control': 'control.html', '/overlay': 'overlay.html', '/organizer': 'organizer.html' };
function serve(res, file, immutable) {
  fs.readFile(file, (e, d) => {
    if (e) { res.writeHead(404); return res.end('Not found. Did you run "npm run build"?'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-store' });
    res.end(d);
  });
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (PAGES[u.pathname]) return serve(res, path.join(DIST, PAGES[u.pathname]), false);
  if (u.pathname.startsWith('/assets/')) {
    const f = path.normalize(path.join(DIST, u.pathname));
    if (!f.startsWith(path.join(DIST, 'assets'))) { res.writeHead(403); return res.end(); }
    return serve(res, f, true);
  }

  if (u.pathname === '/events') {
    const ctl = u.searchParams.get('role') === 'control';
    if (ctl && !authed(req, u)) { res.writeHead(401); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const c = { res, ctl }; clients.add(c);
    if (ctl) sse(c, 'state', snapshot());
    else {   // a freshly loaded overlay restores the name first, then the scoreboard on top of it
      if (state.live && !state.hidden) sse(c, 'cmd', { ...state.live, quiet: true });
      if (state.board) sse(c, 'cmd', { type: 'board', on: true, rows: rows(), quiet: true });
    }
    req.on('close', () => clients.delete(c));
    return;
  }
  if (u.pathname === '/api/ping') { res.writeHead(authed(req, u) ? 200 : 401); return res.end(); }

  if (req.method === 'POST' && u.pathname.startsWith('/api/')) {
    if (!authed(req, u)) { res.writeHead(401); return res.end(); }
    try {
      const b = await body(req);
      switch (u.pathname) {
        case '/api/cmd': {
          if (!['show', 'hide', 'balloon', 'boo', 'cut', 'board'].includes(b.type)) throw 0;
          let m = { type: b.type };
          if (b.type === 'show') {
            const p = Number.isInteger(b.id) ? byId(b.id) : null;
            m = p ? { type: 'show', id: p.id, costume: p.costume, real: p.real, cls: p.cls, score: p.score ?? null }
                  : { type: 'show', id: null, costume: str(b.costume), real: str(b.real), cls: str(b.cls), score: null };
            state.live = m; state.hidden = false;
            if (p) { state.curId = p.id; persist(); }
          } else if (b.type === 'hide') state.hidden = true;   // a modifier: the selection stays
          else if (b.type === 'board') { state.board = !!b.on; m = { type: 'board', on: state.board, rows: rows() }; }
          else if (b.type === 'cut') m.text = str(b.text) || undefined;
          bcast('cmd', m); pushState();
          break;
        }
        case '/api/score': {
          const p = byId(b.id), v = num(b.score);
          if (!p || v === undefined) throw 0;
          p.score = v; if (state.live && state.live.id === p.id) state.live.score = v;
          persist(); sendRows(p.id, v); pushState();
          break;
        }
        case '/api/add':
          (Array.isArray(b.items) ? b.items : []).slice(0, 500).forEach(i => {
            const costume = str(i.costume); if (!costume || state.list.length >= 500) return;
            state.list.push({ id: state.nextId++, costume, real: str(i.real), cls: str(i.cls), score: null });
          });
          persist(); pushState();
          break;
        case '/api/remove':
          state.list = state.list.filter(p => p.id !== b.id);
          forget(new Set([b.id]));
          persist(); sendRows(); pushState();
          break;
        case '/api/clear':
          forget(new Set(state.list.map(p => p.id)));
          state.list = []; persist(); sendRows(); pushState();
          break;
        case '/api/move': {
          const from = state.list.findIndex(p => p.id === b.id);
          if (from < 0 || !Number.isInteger(b.to)) throw 0;
          const [p] = state.list.splice(from, 1);
          state.list.splice(Math.min(state.list.length, Math.max(0, b.to)), 0, p);
          persist(); sendRows(); pushState();
          break;
        }
        case '/api/import': {   // the file's order wins; rows matching an existing participant keep its id
          const items = Array.isArray(b.items) ? b.items.slice(0, 500) : [];
          const pool = new Map();
          state.list.forEach(p => pool.set(keyOf(p), [...(pool.get(keyOf(p)) || []), p]));
          const next = [];
          items.forEach(i => {
            const costume = str(i.costume); if (!costume) return;
            const row = { costume, real: str(i.real), cls: str(i.cls) }, score = num(i.score) ?? null;
            let p = pool.get(keyOf(row))?.shift();
            if (p) { if (score != null) p.score = score; }
            else p = { id: state.nextId++, ...row, score };
            next.push(p);
          });
          const kept = new Set(next), rest = state.list.filter(p => !kept.has(p));
          if (!b.removeMissing) next.push(...rest);
          else forget(new Set(rest.map(p => p.id)));
          if (next.length > 500) throw 0;
          state.list = next;
          if (state.live && byId(state.live.id)) state.live.score = byId(state.live.id).score;
          persist(); sendRows(state.live?.id ?? -1, state.live?.score ?? null); pushState();
          break;
        }
        default: res.writeHead(404); return res.end();
      }
      res.writeHead(204); res.end();
    } catch { res.writeHead(400); res.end(); }
    return;
  }
  res.writeHead(404); res.end('Not found');
}).listen(PORT, () => console.log(`Runway on :${PORT}  /overlay  /control  /organizer   key ${KEY ? 'SET' : 'NOT SET (anyone can control!)'}`));
setInterval(() => clients.forEach(c => c.res.write(': ping\n\n')), 20000);
