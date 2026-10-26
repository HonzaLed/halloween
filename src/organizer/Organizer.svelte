<script>
  import { onMount } from 'svelte';
  import { post, connectControl } from '../lib/api.js';

  let S = $state({ list: [], live: null, board: false });
  let status = $state('');
  let saved = $state(null);

  const scores = $derived(S.list.filter(p => p.score != null).map(p => p.score).sort((a, b) => b - a));
  const now = $derived((S.board ? 'Scoreboard on top. ' : '') + (S.live ? 'Name showing: ' + S.live.costume : 'No name showing'));

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
</script>

<h1>Organizer: points <small>{status}</small></h1>
<p>{now}</p>
<table>
  <thead><tr><th class="rk">Rank</th><th>Costume</th><th>Points (0 to 10)</th></tr></thead>
  <tbody>
    {#each S.list as p (p.id)}
      <tr class:live={S.live?.id === p.id} class:saved={saved === p.id}>
        <td class="rk">{p.score != null ? scores.indexOf(p.score) + 1 : ''}</td>
        <td>{p.costume}<small>{[p.real, p.cls].filter(Boolean).join(', ')}</small></td>
        <td><input type="number" min="0" max="10" step="0.5" inputmode="decimal" aria-label="Points for {p.costume}" value={p.score ?? ''} onchange={e => commit(p, e)}></td>
      </tr>
    {/each}
  </tbody>
</table>
{#if !S.list.length}<p>No participants yet. They are added on the control page.</p>{/if}

<style>
  h1{font-size:20px;margin:0 0 4px}
  h1 small{font-weight:400;opacity:.7;font-size:13px}
  p{margin:0 0 12px;opacity:.85}
  table{width:100%;max-width:900px;border-collapse:collapse;font-size:16px}
  th,td{padding:8px;border-bottom:1px solid var(--line);text-align:left}
  th{font-weight:600;opacity:.8}
  tr.live{background:rgba(179,16,28,.35)}
  tr.saved td:last-child::after{content:' saved';color:#6fcf8e;font-size:13px}
  td small{display:block;opacity:.7}
  input{width:90px;font-size:20px;padding:8px}
  .rk{width:60px;opacity:.8}
</style>
