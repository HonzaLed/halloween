<script>
  import { fmt } from '../lib/format.js';
  let { on, rows, sc } = $props();
  // How many rows fit at the current ?scale
  const n = $derived(Math.max(3, Math.min(8, Math.floor((1000 / sc - 140) / 104))));
  const visible = $derived(rows.slice(0, n));
</script>

<div id="board" class:on>
  <div id="bc">
    <div id="bt">Nejlepší kostýmy</div>
    <div id="rows">
    {#each visible as r, i (r.id)}
      <div class="brow" style="--i:{i};--w:{Math.max(0, Math.min(1, r.score / 10))}">
        <span class="rk">{i + 1}</span>
        <span class="nm">{r.costume}<small>{[r.real, r.cls].filter(Boolean).join(', ')}</small></span>
        <span class="bs">{fmt(r.score)}</span>
      </div>
    {:else}
      <div id="empty">Zatím žádné skóre</div>
    {/each}
    </div>
  </div>
</div>

<style>
  #board{position:fixed;inset:0;z-index:20;visibility:hidden;opacity:0;background:radial-gradient(ellipse at center,rgba(20,4,8,.97),rgba(5,1,3,.99));transition:opacity .5s,visibility 0s .5s}
  #board.on{visibility:visible;opacity:1;transition:opacity .5s}
  #bc{position:absolute;left:50%;top:50px;width:1400px;margin-left:-700px;transform:scale(var(--s));transform-origin:50% 0}
  #bt{font:110px/1.1 Creepster,Impact,cursive;text-align:center;color:var(--bone);text-shadow:0 0 24px rgba(179,16,28,.9),4px 4px 0 #5a0810;margin-bottom:24px}
  .brow{position:relative;display:grid;grid-template-columns:100px 1fr 190px;align-items:center;height:96px;margin-bottom:8px;padding:0 24px;background:rgba(255,255,255,.05);border-left:6px solid var(--blood);overflow:hidden}
  .brow:first-child{height:110px;border-left-color:var(--bone)}
  .brow::before{content:'';position:absolute;left:0;top:0;bottom:0;width:calc(var(--w)*100%);background:linear-gradient(90deg,rgba(179,16,28,.6),rgba(179,16,28,.08));transform-origin:left}
  .brow>*{position:relative}
  .on .brow{animation:rowin .6s cubic-bezier(.2,.8,.3,1) both;animation-delay:calc(var(--i)*.1s + .5s)}
  .on .brow::before{animation:bar 1s cubic-bezier(.2,.8,.3,1) both;animation-delay:calc(var(--i)*.1s + .8s)}
  @keyframes rowin{from{opacity:0;transform:translateX(-140px)}to{opacity:1;transform:none}}
  @keyframes bar{from{transform:scaleX(0)}to{transform:none}}
  .rk{font:64px Creepster,Impact,cursive;color:var(--ash)}
  .nm{font:52px/1 Creepster,Impact,cursive;color:var(--bone);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .nm small{display:block;font:24px 'Special Elite','Courier New',monospace;color:var(--ash);margin-top:6px}
  .bs{font:68px Creepster,Impact,cursive;text-align:right;color:var(--bone);text-shadow:2px 2px 0 #3a0409}
  #empty{font:40px 'Special Elite',monospace;color:var(--ash);text-align:center;padding:60px}
</style>
