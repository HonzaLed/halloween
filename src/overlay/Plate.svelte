<script>
  import { flushSync } from 'svelte';
  import { fmt } from '../lib/format.js';

  let { onshown } = $props();

  let shown = $state(false);
  let snap = $state(false);
  let m = $state({ id: null, costume: '', real: '', cls: '', score: null });
  let clipEl, costumeEl, badgeEl, wrapEl, timer;

  const fontSize = $derived(m.costume.length > 24 ? 78 : m.costume.length > 15 ? 100 : 128);
  const drips = Array.from({ length: 11 }, (_, i) => {
    const w = 8 + Math.random() * 10;
    return `left:${i * 9 + Math.random() * 6}%;width:${w}px;height:${14 + Math.random() * 22}px;border-radius:0 0 ${w}px ${w}px;transition-delay:${Math.random() * 0.6}s;--d:${16 + Math.random() * 16}s;--f:${1.8 + Math.random() * 1.4}`;
  });

  export const isShown = () => shown;
  export const liveId = () => m.id;

  export function flicker() {
    const k = (opacity, offset) => ({ opacity, offset, easing: 'steps(1)' });
    costumeEl?.animate([k(1, 0), k(0.15, 0.08), k(1, 0.12), k(0.35, 0.22), k(1, 0.26), k(0.6, 0.6), k(1, 0.64), k(1, 1)], { duration: 900 });
  }

  /** Hide instantly, with no slide (used while the cutscreen covers the screen). */
  export function snapHide() {
    snap = true; shown = false; flushSync();
    void wrapEl.offsetWidth;
    snap = false; flushSync();
  }

  export function hide() { clearTimeout(timer); shown = false; }

  export function show(next) {
    clearTimeout(timer);
    const was = shown;
    shown = false;
    timer = setTimeout(() => {
      m = { id: next.id ?? null, costume: (next.costume || '').trim(), real: next.real || '', cls: next.cls || '', score: next.score ?? null };
      shown = true;
      flicker();
      onshown?.(next);
    }, was ? 1000 : 50);
  }

  /** Update the committee score. With animate=true the number stamps in. */
  export function setScore(v, animate) {
    m.score = v ?? null;
    if (!animate || v == null) return;
    badgeEl.animate([
      { transform: 'scale(3.4) rotate(-18deg)', opacity: 0 },
      { transform: 'scale(.88) rotate(2deg)', opacity: 1, offset: 0.55 },
      { transform: 'scale(1.07) rotate(-6deg)', offset: 0.75 },
      { transform: 'scale(1) rotate(-5deg)', opacity: 1 },
    ], { duration: 700, easing: 'cubic-bezier(.2,.8,.3,1)' });
    clipEl.animate([
      { transform: 'none' }, { transform: 'translate(-9px,3px)' }, { transform: 'translate(7px,-3px)' },
      { transform: 'translate(-4px,2px)' }, { transform: 'none' },
    ], { duration: 400, delay: 250 });
  }
</script>

<div id="wrap" class:show={shown} class:snap bind:this={wrapEl}>
  <div id="clip" bind:this={clipEl}>
    <div id="plate">
      <div id="bar"></div>
      <div id="drips">{#each drips as d}<div class="drip" style={d}></div>{/each}</div>
      <div id="costume" bind:this={costumeEl} style="font-size:{fontSize}px">{m.costume}</div>
      <div id="who">
        {#if m.real}<span>{m.real}</span>{/if}
        {#if m.cls}<span id="cls">{m.cls}</span>{/if}
      </div>
      <div id="badge" class:got={m.score != null} bind:this={badgeEl}>{m.score != null ? fmt(m.score) : '?'}</div>
    </div>
  </div>
</div>

<style>
  #wrap{position:absolute;left:calc(90px*var(--s));bottom:calc(90px*var(--s));transform:scale(var(--s));transform-origin:0 100%}
  #clip{position:relative;overflow:hidden;padding:0 60px 60px;margin:0 -60px -60px}
  #plate{position:relative;min-width:760px;max-width:min(1300px,calc((1920px - 180px*var(--s))/var(--s)));box-sizing:border-box;padding:84px 250px 30px 56px;background:#0d0407;border:3px solid var(--blood);box-shadow:0 0 36px 4px rgba(179,16,28,.6);transform:translateY(calc(-100% - 90px));transition:transform .8s cubic-bezier(.6,0,.3,1);will-change:transform}
  .show #plate{transform:none}
  .snap #plate,.snap .drip{transition:none!important;animation:none!important}
  #bar{position:absolute;left:0;right:0;top:0;height:16px;background:var(--blood)}
  .drip{position:absolute;top:10px;background:var(--blood);transform:scaleY(0);transform-origin:top;transition:transform 1.2s cubic-bezier(.3,.9,.4,1);will-change:transform}
  .show .drip{transform:scaleY(1);animation:flow var(--d) ease-out 1.5s forwards}
  @keyframes flow{to{transform:scaleY(var(--f))}}
  #costume,#who{position:relative;z-index:1}
  #costume{font-family:Creepster,Impact,cursive;color:var(--bone);line-height:.95;letter-spacing:2px;text-shadow:0 0 14px rgba(179,16,28,.9),3px 3px 0 #5a0810}
  #who{margin-top:18px;display:flex;gap:22px;align-items:center;font-size:36px;color:var(--ash)}
  #cls{border:2px solid var(--blood);padding:2px 16px;color:var(--bone);background:rgba(179,16,28,.35)}
  #badge{position:absolute;right:50px;top:56%;width:160px;height:160px;margin-top:-80px;border-radius:50%;display:grid;place-items:center;box-sizing:border-box;border:4px dashed rgba(241,220,220,.3);color:rgba(241,220,220,.3);font:96px/1 Creepster,Impact,cursive;z-index:1}
  #badge.got{border:5px solid var(--bone);color:var(--bone);background:radial-gradient(circle,#c4121f,#7a0a12 75%);box-shadow:0 0 34px 6px rgba(179,16,28,.8);transform:rotate(-5deg);text-shadow:2px 2px 0 #3a0409}
</style>
