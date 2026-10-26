import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

const r = f => fileURLToPath(new URL(f, import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: { input: { overlay: r('overlay.html'), control: r('control.html'), organizer: r('organizer.html') } },
  },
  // `npm run dev` serves the pages with hot reload and forwards the API to the Node server (npm run server).
  server: { proxy: { '/api': 'http://localhost:3000', '/events': 'http://localhost:3000' } },
});
