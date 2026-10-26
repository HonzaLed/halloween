<script>
  import { onMount } from 'svelte';
  let { x, dx, ondone } = $props();
  let el;
  onMount(() => {
    el.animate([
      { transform: 'translate(0,0) rotate(-4deg)' },
      { transform: `translate(${dx / 2}px,-700px) rotate(5deg)`, offset: 0.5 },
      { transform: `translate(${dx}px,-1450px) rotate(-3deg)` },
    ], { duration: 7000, easing: 'ease-in' }).onfinish = ondone;
  });
</script>

<div class="balloon" bind:this={el} style="left:{x}px">
  <svg viewBox="0 0 110 240"><defs><radialGradient id="g" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#e5303c"/><stop offset=".6" stop-color="#b3101c"/><stop offset="1" stop-color="#5a0810"/></radialGradient></defs><ellipse cx="55" cy="62" rx="48" ry="58" fill="url(#g)"/><path d="M55 118l-10 13h20z" fill="#9a0e18"/><ellipse cx="36" cy="38" rx="8" ry="16" fill="#fff" opacity=".35" transform="rotate(25 36 38)"/><path d="M55 131C44 160 66 182 52 238" stroke="#e8d0d0" stroke-width="2" fill="none"/></svg>
</div>

<style>
  .balloon{position:fixed;bottom:calc(-280px*var(--s));pointer-events:none;z-index:10}
  .balloon svg{display:block;width:calc(110px*var(--s));height:auto}
</style>
