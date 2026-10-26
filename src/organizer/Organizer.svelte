<script>
  import { onMount } from 'svelte';
  import { post, connectControl } from '../lib/api.js';
  import { toCsv, parseCsv, download } from '../lib/csv.js';

  let S = $state({ list: [], cur: null, live: null, hidden: false, board: false });
  let status = $state('');
  let saved = $state(null);
  let form = $state({ costume: '', real: '', cls: '' });
  let removeMissing = $state(false);
  let note = $state('');
  const offline = () => { status = 'Offline'; };

  const scores = $derived(S.list.filter(p => p.score != null).map(p => p.score).sort((a, b) => b - a));
  const idx = $derived(S.list.findIndex(p => p.id === S.cur));
  const now = $derived((S.board ? 'Scoreboard on top. ' : '')
    + (idx >= 0 ? `Current: #${idx + 1} ${S.list[idx].costume}` : S.live ? 'Not in list: ' + S.live.costume : 'No one selected')
    + (S.live ? (S.hidden ? ' (hidden)' : ' (on air)') : ''));

  onMount(() => {
    let es;
    connectControl(s => { S = s; }, t => { status = t; }).then(e => { es = e; });
    return () => es?.close();
  });

  async function commit(p, e) {
    const raw = e.currentTarget.value;
    const v = raw === '' ? null : Math.min(10, Math.max(0, +raw));
    if (v !== null) e.currentTarget.value = v;
    const r = await post('/api/score', { id: p.id, score: v }, () => { status = 'Offline'; });
    if (r?.ok) { saved = p.id; setTimeout(() => { if (saved === p.id) saved = null; }, 1500); }
  }

  const exportCsv = () => download('participants-' + new Date().toISOString().slice(0, 10) + '.csv', toCsv(S.list));

  async function upload(e) {
    const f = e.currentTarget.files[0];
    e.currentTarget.value = '';
    if (!f) return;
    const items = parseCsv(await f.text());
    if (!items.length) { note = 'No participants found in ' + f.name + ' (needs a costume column).'; return; }
    if (removeMissing && !confirm('Remove everyone who is not in ' + f.name + '?')) return;
    const r = await post('/api/import', { items, removeMissing }, offline);
    note = r?.ok ? `Imported ${items.length} rows from ${f.name}.` : r ? 'Import failed (at most 500 participants).' : '';
  }

  function add() {
    if (!form.costume.trim()) return;
    post('/api/add', { items: [{ ...form }] }, offline);
    form = { costume: '', real: '', cls: '' };
  }
  const move = (p, to) => post('/api/move', { id: p.id, to }, offline);
</script>

<h1>Organizer: points <small>{status}</small></h1>
<p>{now}</p>

<div class="tools">
  <button onclick={exportCsv} disabled={!S.list.length}>Export CSV</button>
  <label class="file">Upload CSV<input type="file" accept=".csv,text/csv,text/plain" onchange={upload}></label>
  <label><input type="checkbox" bind:checked={removeMissing}> remove people missing from the file</label>
</div>
<p class="hint">CSV columns: costume, real name, class, score. The file's order becomes the list order; rows that match an existing costume, name and class keep their place in the list and update the score if one is given, other rows are added.</p>
{#if note}<p role="status">{note}</p>{/if}

<form class="row add" onsubmit={e => { e.preventDefault(); add(); }}>
  <input placeholder="Costume name" aria-label="Costume name" bind:value={form.costume}>
  <input placeholder="Real name" aria-label="Real name" bind:value={form.real}>
  <input placeholder="Class" aria-label="Class" bind:value={form.cls}>
  <button class="go">Add</button>
</form>

<table>
  <thead><tr><th class="rk">#</th><th class="rk">Rank</th><th>Costume</th><th>Points (0 to 10)</th><th>Order</th></tr></thead>
  <tbody>
    {#each S.list as p, i (p.id)}
      <tr class:cur={S.cur === p.id} class:hidden={S.hidden && S.cur === p.id} class:saved={saved === p.id}>
        <td class="rk">{i + 1}</td>
        <td class="rk">{p.score != null ? scores.indexOf(p.score) + 1 : ''}</td>
        <td>{p.costume}<small>{[p.real, p.cls].filter(Boolean).join(', ')}</small></td>
        <td><input type="number" min="0" max="10" step="0.5" inputmode="decimal" aria-label="Points for {p.costume}" value={p.score ?? ''} onchange={e => commit(p, e)}></td>
        <td class="mv">
          <button aria-label="Move {p.costume} up" disabled={i === 0} onclick={() => move(p, i - 1)}>↑</button>
          <button aria-label="Move {p.costume} down" disabled={i === S.list.length - 1} onclick={() => move(p, i + 1)}>↓</button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>
{#if !S.list.length}<p>No participants yet. Add them above or upload a CSV.</p>{/if}

<style>
  h1{font-size:20px;margin:0 0 4px}
  h1 small{font-weight:400;opacity:.7;font-size:13px}
  p{margin:0 0 12px;opacity:.85}
  table{width:100%;max-width:900px;border-collapse:collapse;font-size:16px}
  th,td{padding:8px;border-bottom:1px solid var(--line);text-align:left}
  th{font-weight:600;opacity:.8}
  tr.cur{background:rgba(179,16,28,.35)}
  tr.cur.hidden{background:rgba(179,16,28,.15)}
  tr.saved td:last-child::after{content:' saved';color:#6fcf8e;font-size:13px}
  td small{display:block;opacity:.7}
  input{width:90px;font-size:20px;padding:8px}
  .tools{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
  .file{border:1px solid var(--line);background:#2b1017;border-radius:5px;padding:9px 13px;cursor:pointer}
  .file:hover,.file:focus-within{border-color:var(--blood)}
  .file input{position:absolute;opacity:0;width:1px;height:1px}
  .hint{font-size:13px;opacity:.7;max-width:900px}
  .add{max-width:900px;margin-bottom:14px}
  .add input{flex:1;min-width:140px}
  .mv{white-space:nowrap}
  .mv button{padding:6px 10px}
  button:disabled{opacity:.35;cursor:default}
  .rk{width:60px;opacity:.8}
</style>
