<script>
  import { onMount } from 'svelte';
  import { post, connectControl } from '../lib/api.js';

  let S = $state({ list: [], cur: null, live: null, hidden: false, board: false });
  let status = $state('');
  let form = $state({ costume: '', real: '', cls: '' });
  let bulk = $state('');

  const idx = $derived(S.list.findIndex(p => p.id === S.cur));
  const now = $derived((S.board ? 'Scoreboard on top. ' : '')
    + (idx >= 0 ? `#${idx + 1} of ${S.list.length}: ${S.list[idx].costume}` : S.live ? 'Not in list: ' + S.live.costume : 'No one selected')
    + (S.live ? (S.hidden ? ' (hidden)' : ' (on air)') : ''));
  const offline = () => { status = 'Offline'; };
  const cmd = m => post('/api/cmd', m, offline);

  onMount(() => {
    let es;
    connectControl(s => { S = s; }, t => { status = t; }).then(e => { es = e; });
    return () => es?.close();
  });

  function show(i) { if (i >= 0 && i < S.list.length) cmd({ type: 'show', id: S.list[i].id }); }
  function add() {
    if (!form.costume.trim()) return;
    post('/api/add', { items: [{ ...form }] }, offline);
    form = { costume: '', real: '', cls: '' };
  }
  function showNow() {
    if (!form.costume.trim()) return;
    cmd({ type: 'show', ...form });
    form = { costume: '', real: '', cls: '' };
  }
  function load() {
    const items = bulk.split('\n').map(l => l.split('|').map(s => s.trim()))
      .filter(([c]) => c).map(([costume, real, cls]) => ({ costume, real: real || '', cls: cls || '' }));
    bulk = '';
    post('/api/add', { items }, offline);
  }
  const remove = p => { if (confirm('Remove ' + p.costume + '?')) post('/api/remove', { id: p.id }, offline); };
  const clearAll = () => { if (confirm('Clear the whole list including all scores?')) post('/api/clear', {}, offline); };

  function onkey(e) {
    if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); show(idx + 1); }
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'Escape') cmd({ type: 'hide' });
  }
</script>

<svelte:window onkeydown={onkey} />

<h1>Runway control <small>{status}</small></h1>

<section>
  <p id="now">{now}</p>
  <div class="row">
    <button class="go" onclick={() => show(idx + 1)}>Show next</button>
    <button onclick={() => show(idx - 1)}>Previous</button>
    {#if S.hidden && idx >= 0}<button onclick={() => show(idx)}>Unhide</button>
    {:else}<button onclick={() => cmd({ type: 'hide' })}>Hide</button>{/if}
  </div>
</section>

<section>
  <div class="row">
    <button onclick={() => cmd({ type: 'board', on: !S.board })}>Scoreboard: {S.board ? 'hide' : 'show'}</button>
    <button onclick={() => cmd({ type: 'cut' })}>Test cutscreen</button>
    <button onclick={() => cmd({ type: 'balloon' })}>Balloon</button>
    <button onclick={() => cmd({ type: 'boo' })}>Boo flash</button>
  </div>
</section>

<section>
  <strong>Registered participants</strong> <small>(points are entered on the <a href="/organizer">organizer page</a>)</small>
  <ul>
    {#each S.list as p, i (p.id)}
      <li class:cur={p.id === S.cur}>
        <span class="n">{i + 1}</span>
        <button class="t" title="Show on stream" onclick={() => show(i)}>{p.costume}<small>{[p.real, p.cls].filter(Boolean).join(', ')}</small></button>
        <span class="sc">{p.score ?? ''}</span>
        <button class="x" title="Remove" aria-label="Remove {p.costume}" onclick={() => remove(p)}>×</button>
      </li>
    {/each}
  </ul>
  {#if !S.list.length}<p class="dim">No one yet. Add someone below or paste a list.</p>{/if}
</section>

<section>
  <input placeholder="Costume name" bind:value={form.costume}>
  <input placeholder="Real name" bind:value={form.real}>
  <input placeholder="Class" bind:value={form.cls}>
  <div class="row"><button onclick={add}>Add to list</button><button class="go" onclick={showNow}>Show now (not in list)</button></div>
</section>

<section>
  <details>
    <summary>Paste a list</summary>
    <textarea rows="6" placeholder={'One per line:\nCostume name | Real name | Class'} bind:value={bulk}></textarea>
    <div class="row"><button onclick={load}>Add lines</button><button onclick={clearAll}>Clear list</button></div>
  </details>
</section>

<style>
  h1{font-size:18px;margin:0 0 10px}
  h1 small{font-weight:400;opacity:.7;font-size:13px}
  section{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:12px;margin-bottom:12px}
  section input,section textarea{width:100%;margin-bottom:8px}
  #now{font-size:17px;margin:0 0 10px;min-height:24px}
  .dim{opacity:.7}
  ul{list-style:none;margin:0;padding:0;max-height:340px;overflow:auto}
  li{display:flex;gap:6px;align-items:center;padding:5px 4px;border-bottom:1px solid var(--line)}
  li.cur{background:rgba(179,16,28,.3)}
  .t{flex:1;min-width:0;text-align:left;background:none;border:0;padding:4px}
  .t small{display:block;opacity:.7}
  .n{min-width:26px;text-align:right;opacity:.6}
  .sc{min-width:34px;text-align:right;font-weight:600}
  .x{padding:2px 8px}
  summary{cursor:pointer;margin-bottom:8px}
</style>
