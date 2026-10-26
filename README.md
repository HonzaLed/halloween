# Runway graphics

Live graphics for the school Halloween runway: name plate, committee score, cutscreen, scoreboard.
Svelte 5 + Vite front end, tiny dependency-free Node server (live updates over SSE).

## Pages
| URL | Use |
|---|---|
| `/overlay` | OBS Browser source, 1920x1080, transparent |
| `/control?key=...` | Operator (phone): show names, scoreboard, cutscreen, effects |
| `/organizer?key=...` | Points table, synced everywhere |

Overlay options: `?scale=1.5` (size, 0.3 to 4), `?balloon=1` (balloon with every name).
In OBS set the Browser source to a custom frame rate of 60 FPS.

## Run (the built `dist/` is included, so no install is needed)
    CONTROL_KEY=choose-a-secret node server/index.js     # PORT=8080 to change the port

Put it behind HTTPS (Caddy is easiest; nginx needs `proxy_buffering off;`).
Names and points are saved in `data.json` (set `DATA_FILE` to move it; delete it to start fresh).

## Develop
    npm install
    npm run server      # API + SSE on :3000
    npm run dev         # Vite with hot reload, proxies /api and /events to :3000
    npm run build       # rebuild dist/

## Layout
    server/index.js          static pages, SSE, JSON API
    src/overlay/             Overlay (message handling) + Plate, Board, Cut, Balloon components
    src/control/ organizer/  the two operator pages
    src/lib/                 api helpers, shared styles
    preview.html             standalone design sandbox (no server), optional
