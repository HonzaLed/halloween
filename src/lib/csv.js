// Participant CSV: export from the stored list, parse an uploaded file back into rows.
const HEAD = ['position', 'costume', 'real name', 'class', 'score'];
const ALIAS = {   // header text (lowercase) -> field
  costume: 'costume', kostym: 'costume', 'kostým': 'costume',
  real: 'real', 'real name': 'real', name: 'real', jmeno: 'real', 'jméno': 'real',
  class: 'cls', cls: 'cls', trida: 'cls', 'třída': 'cls',
  score: 'score', points: 'score', body: 'score',
};
const FIELDS = ['costume', 'real', 'cls', 'score'];

// Spreadsheet formulas start with = + - @; a leading ' keeps them text (and is removed again on import).
const safe = v => /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
const cell = v => /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;

export function toCsv(list) {
  const lines = list.map((p, i) => [i + 1, safe(p.costume), safe(p.real), safe(p.cls), p.score ?? ''].map(v => cell(String(v))).join(','));
  return '﻿' + [HEAD.join(','), ...lines].join('\r\n') + '\r\n';
}

export function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function table(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/, 1)[0];
  const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const out = []; let row = [], v = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c !== '"') v += c;
      else if (text[i + 1] === '"') { v += '"'; i++; }
      else q = false;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(v); v = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(v); v = ''; out.push(row); row = [];
    } else v += c;
  }
  if (v || row.length) { row.push(v); out.push(row); }
  return out.filter(r => r.some(s => s.trim()));
}

/** Rows as { costume, real, cls, score? }. Uses the header row when it has a costume column, else the order costume, real, class, score. */
export function parseCsv(text) {
  const rows = table(text);
  if (!rows.length) return [];
  const map = rows[0].map(h => ALIAS[h.trim().toLowerCase()]);
  const header = map.includes('costume');
  const cols = header ? map : FIELDS;
  return (header ? rows.slice(1) : rows).map(r => {
    const o = {};
    cols.forEach((f, i) => { if (f && r[i] !== undefined) o[f] = r[i].trim().replace(/^'(?=[=+\-@])/, ''); });
    return o;
  }).filter(o => o.costume);
}
