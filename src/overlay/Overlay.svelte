<script>
  import { onMount } from 'svelte';
  import Plate from './Plate.svelte';
  import Board from './Board.svelte';
  import Cut from './Cut.svelte';
  import Balloon from './Balloon.svelte';

  // URL options:  ?scale=1.5  (size, 0.3 to 4)   ?balloon=1  (balloon with every name)
  const Q = new URLSearchParams(location.search);
  const SC = Math.min(4, Math.max(0.3, parseFloat(Q.get('scale')) || 1));
  const AUTO_BALLOON = Q.get('balloon') === '1';
  document.documentElement.style.setProperty('--s', SC);

  let plate, cut, flashEl;
  let boardOn = $state(false);
  let rows = $state([]);
  let balloons = $state([]);
  let nextBalloon = 0;

  function balloon() {
    balloons.push({ id: nextBalloon++, x: Math.random() * (1920 - 120 * SC), dx: (Math.random() - 0.5) * 200 });
  }
  const dropBalloon = id => { balloons = balloons.filter(b => b.id !== id); };

  function boo() {
    flashEl.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0.1 }, { opacity: 0.9 }, { opacity: 0 }], { duration: 900 });
    plate.flicker();
  }

  // The scoreboard and cutscreen are layers on top; they never change the state of the plate underneath.
  function handle(m) {
    switch (m.type) {
      case 'show':
        if (m.cut) cut.play('Halloween Runway', () => { plate.snapHide(); setTimeout(() => plate.show(m), 60); });
        else plate.show(m);
        break;
      case 'hide': plate.hide(); break;
      case 'score':
        if (m.rows) rows = m.rows;
        if (m.id != null && m.id === plate.liveId() && plate.isShown()) plate.setScore(m.score, !boardOn);
        break;
      case 'board':
        if (m.rows) rows = m.rows;
        if (m.on && !boardOn) { if (m.quiet) boardOn = true; else cut.play('Best performances', () => { boardOn = true; }); }
        else if (!m.on && boardOn) cut.play('Back to the runway', () => { boardOn = false; });
        break;
      case 'cut': cut.play(m.text, () => {}); break;
      case 'balloon': balloon(); break;
      case 'boo': boo(); break;
    }
  }

  onMount(() => {
    const es = new EventSource('/events');
    es.addEventListener('cmd', e => handle(JSON.parse(e.data)));
    return () => es.close();
  });
</script>

<div id="flash" bind:this={flashEl}></div>
<Plate bind:this={plate} onshown={m => { if (AUTO_BALLOON && !m.quiet) balloon(); }} />
{#each balloons as b (b.id)}<Balloon x={b.x} dx={b.dx} ondone={() => dropBalloon(b.id)} />{/each}
<Board on={boardOn} {rows} sc={SC} />
<Cut bind:this={cut} />

<style>
  #flash{position:fixed;inset:0;opacity:0;z-index:15;pointer-events:none;background:radial-gradient(ellipse at center,rgba(179,16,28,0) 35%,rgba(179,16,28,.85) 100%)}
</style>
