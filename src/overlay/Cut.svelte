<script>
  let visible = $state(false);
  let text = $state('');
  let bgEl, txtEl;

  // Blood drips hang from the bottom edge (curtain coming in); blood columns rise from the top edge (curtain draining out).
  const spread = (i) => `left:${i * 3.4 - 1 + Math.random() * 2}%`;
  const drips = Array.from({ length: 30 }, (_, i) => { const w = 34 + Math.random() * 34; return `${spread(i)};width:${w}px;height:${50 + Math.random() * 170}px;border-radius:0 0 ${w}px ${w}px`; });
  const columns = Array.from({ length: 30 }, (_, i) => { const w = 40 + Math.random() * 50; return `${spread(i)};width:${w}px;height:${30 + Math.random() * 190}px;border-radius:${w}px ${w}px 0 0`; });

  /** Plays the 1.8 s curtain. `swap` runs while the screen is fully covered. */
  export function play(label, swap) {
    const D = 1800, E = 'cubic-bezier(.65,0,.35,1)';
    text = label || 'Halloween Runway';
    visible = true;
    bgEl.animate([
      { transform: 'translateY(-130%)', easing: E },
      { transform: 'translateY(0)', offset: 0.38 },
      { transform: 'translateY(0)', offset: 0.62, easing: E },
      { transform: 'translateY(125%)' },
    ], { duration: D }).onfinish = () => { visible = false; };
    txtEl.animate([
      { opacity: 0, transform: 'scale(.8)' },
      { opacity: 0, transform: 'scale(.8)', offset: 0.3 },
      { opacity: 1, transform: 'scale(1)', offset: 0.42 },
      { opacity: 1, offset: 0.6 },
      { opacity: 0, transform: 'scale(1.1)' },
    ], { duration: D });
    setTimeout(() => swap?.(), D * 0.48);
  }
</script>

<div id="cut" class:visible>
  <div id="cutbg" bind:this={bgEl}>
    {#each drips as d}<i style={d}></i>{/each}
    {#each columns as c}<b style={c}></b>{/each}
  </div>
  <div id="cuttxt" bind:this={txtEl}>{text}</div>
</div>

<style>
  #cut{position:fixed;inset:0;overflow:hidden;visibility:hidden;pointer-events:none;z-index:50}
  #cut.visible{visibility:visible}
  #cutbg{position:absolute;inset:0;background:linear-gradient(#8f0e19,#5e0810);transform:translateY(-130%)}
  i{position:absolute;top:100%;background:#5e0810}
  b{position:absolute;bottom:100%;background:#8f0e19}
  #cuttxt{position:absolute;inset:0;display:grid;place-items:center;font:170px Creepster,Impact,cursive;color:var(--bone);text-shadow:0 0 30px #000,4px 4px 0 #2a0307;opacity:0}
</style>
