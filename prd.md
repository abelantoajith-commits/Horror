# PRD: NAGAVALLI — Multiplayer Horror Hide & Seek

> **Instructions for the AI coding agent (Antigravity):** Read this whole document first, then build in the order of **Section 14 (Build Order)**. Speed matters more than polish. Ship a working MVP first. Use placeholder shapes if a sprite file is missing. Do not add features that are not listed here.

---

## 1. Overview

A **3 to 5 player**, browser-based horror hide-and-seek game. One player is **Nagavalli** (the seeker), assigned randomly, and everyone else (2 to 4 players) is a **Hider**. The whole map is dark: every player only sees a small circle of light around their own character. Nagavalli must catch all hiders before time runs out.

When the round ends, a **webcam photo** is captured and shown on every player's screen, and anyone can download or share it:

| Outcome | Photo taken of | When |
|---|---|---|
| Nagavalli catches everyone (Nagavalli wins) | The **first hider who was caught** | At the moment they were caught |
| Time runs out (Hiders win) | **Nagavalli's player** | Instantly when time runs out |

**Target:** desktop browsers only. **Deployable** on Vercel as a static site.

## 2. Goals and Non-Goals

**Goals**
- Fast to build: no custom backend server, no database.
- Rooms joined via a shared room key. 3 to 5 players per game (minimum 3, maximum 5).
- Real-time position sync, with all players seeing the same maze.
- Camera permission requested up front, before anything else.
- Shareable photo result screen.

**Non-Goals (do NOT build)**
- Accounts or login, persistent storage, leaderboards.
- Mobile or touch controls.
- Voice chat, text chat.
- More than one room per player at a time, spectating by people outside the room (only caught hiders spectate).
- Photo storage on any server.

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite + TypeScript (JS is acceptable if faster) |
| Styling | Tailwind CSS (menus and UI overlay only) |
| Game rendering | HTML5 `<canvas>` 2D (pixel art, `image-rendering: pixelated`) |
| Realtime | **Supabase Realtime** (Broadcast + Presence). No tables needed. |
| Camera | `navigator.mediaDevices.getUserMedia` |
| Share | Web Share API (with files) with download fallback |
| Hosting | **Vercel** (static Vite build) |

**Important:** Vercel serverless functions cannot hold WebSocket connections. Vercel only hosts the static site; Supabase Realtime is the "common server" that relays data between players.

**Environment variables** (set in Vercel and `.env.local`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## 4. Screen Flow

```
[0 Camera Gate] -> [1 Main Menu] -> [2 Player Selection / Lobby] -> [3 Role Reveal]
   -> [4a Nagavalli Screen] or [4b Hider Screen] -> [5 Result Screen] -> back to Lobby
```

### Screen 0 — Camera Gate (runs before anything else)
- Full-screen dark page: title, a short horror-themed warning: *"This game uses your camera. A photo of you will be taken during the game and shown to other players."*
- Button **"Allow Camera"** calls `getUserMedia({ video: { width: 320, height: 240 }, audio: false })`.
- If **granted:** keep the `MediaStream` in app state (hidden `<video>` element, never shown during gameplay) and go to the Main Menu.
- If **denied or unavailable:** show an error with a retry button. The player **cannot continue** without camera access.
- Must be served over HTTPS (Vercel does this automatically; `localhost` is fine for dev).

### Screen 1 — Main Menu
- Game title "NAGAVALLI" with a dark, flickering horror style.
- Inputs: **Player Name** (max 12 chars, required).
- Buttons:
  - **Create Room:** generates a 6-character uppercase alphanumeric key (e.g. `K7QX2M`) and joins it.
  - **Join Room:** shows a key input; the player enters the key and joins.
- Errors: *Room full (5/5)*, *Game already in progress*, *Connection failed*.

### Screen 2 — Player Selection (Lobby)
- Shows the **room key** (with a copy button) so it can be shared.
- 5 player slots (3 required, 5 maximum) showing name and chosen character skin; empty slots show "Waiting...".
- Each player picks a **character skin** from 5 hider sprites (no duplicate skins within a room, so every player can always get a unique one). Nagavalli always uses her own special sprite once the role is assigned, so skin choice only matters if you end up as a hider.
- Each player presses **Ready**.
- The **host** (the player who has been present in the room the longest) gets a **Start Game** button, enabled only when **at least 3 players are present (up to 5) and all present players are ready**. Show "Need at least 3 players" while fewer are in the room. Nobody can join once the host starts the game.
- On start, the host randomly picks one player as Nagavalli (see Section 6).

### Screen 3 — Role Reveal (3 seconds)
- Full black screen with the text **"YOU ARE NAGAVALLI"** (red) or **"HIDE."** (white), then moves to the game.

### Screen 4a — Nagavalli Screen
- Objective text (small, top): **"Catch them all."**
- Canvas with a dark overlay; only a circle around Nagavalli is visible (Section 8).
- During the **head start** she cannot move: the screen is fully black with a countdown ("She is counting... 23").
- During the chase: HUD shows time left and **caught X / N** (N = number of hiders in this round, 2 to 4).
- Hiders are only visible while inside her light circle.

### Screen 4b — Hider Screen
- Objective text: **"Escape Nagavalli."**
- **Head start (30 s):** hiders can move freely to pick a hiding position. HUD shows the countdown. Vision is limited to the same kind of light circle.
- **Chase:** HUD shows time left and how many hiders are still free.
- Nagavalli is only visible while inside the hider's light circle.
- When caught: the hider's screen goes to a "YOU WERE CAUGHT" **spectator state** and waits for the round to end. A caught hider is out of the round and can no longer move. They **spectate** by viewing the game through another player's light circle (a remaining hider first, otherwise Nagavalli) with the same limited vision as that player. Press **Tab** or the **left/right arrow keys** to switch whom they watch. Spectators still see the HUD and the result screen.

### Screen 5 — Result Screen
- Shows the round photo, large, with a horror filter (red tint, vignette, grain via CSS), plus caption:
  - Nagavalli won: **"NAGAVALLI GOT {name}"**
  - Hiders won: **"{name} WAS NAGAVALLI... AND FAILED"**
- Buttons: **Download**, **Share** (Web Share API with the image file; fall back to download if unsupported), **Back to Lobby**.
- The same photo appears on every player's screen at the same time (3 to 5 screens).

## 5. Game Rules and Constants

Put all values in one file `src/game/config.ts` so they are easy to tune.

```ts
export const CONFIG = {
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 5,
  HEAD_START_SEC: 30,
  CHASE_SEC: 180,            // hiders win if this runs out
  ROLE_REVEAL_SEC: 3,

  TILE: 16,                  // px per tile (internal resolution)
  MAZE_COLS: 31,             // must be odd
  MAZE_ROWS: 21,             // must be odd
  INTERNAL_W: 480,           // internal canvas size, scaled up with CSS
  INTERNAL_H: 270,

  SPEED_HIDER: 60,           // px/s
  SPEED_NAGAVALLI: 58,       // px/s (slightly slower so hiders can escape)

  VISION_NAGAVALLI: 20,      // light radius in internal px
  VISION_HIDER: 18,

  CATCH_DISTANCE: 10,        // px between centers to count as caught
  SEND_RATE_HZ: 10,          // position broadcasts per second
  PLAYER_SIZE: 10,           // collision box
};
```

**Note on vision radius:** the internal canvas is 480x270 and is scaled up to fill the window (about 3-4x), so a 20 px radius looks about 60-80 px on screen. Adjust `VISION_*` if it feels too tight or too loose.

**Win conditions**
- **Nagavalli wins:** all hiders (N = players - 1, so 2 to 4) are caught before the chase timer hits 0.
- **Hiders win:** the chase timer reaches 0 with at least one hider uncaught.

## 6. Realtime Architecture (Supabase)

One Supabase Realtime **channel per room**: `room:{ROOM_KEY}`.

```ts
const channel = supabase.channel(`room:${roomKey}`, {
  config: { broadcast: { self: false }, presence: { key: playerId } },
});
```

- `playerId`: random UUID generated per browser tab on load.
- **Presence** tracks: `{ playerId, name, skin, ready, joinedAt }`. Used for the lobby, the player count (max 5) and detecting disconnects.
- **Broadcast** carries all game events.
- **Host** = the player with the earliest `joinedAt` in presence. The host runs the clock and role assignment. If the host disconnects during a game, the game ends and everyone returns to the lobby with the message "Host left".
- The server is only a relay: no authoritative game server. Each client simulates its own movement; Nagavalli's client detects catches.

### Broadcast events

| Event | Sent by | Payload | Purpose |
|---|---|---|---|
| `game_start` | Host | `{ seed, nagavalliId, spawns: {playerId:{x,y}}, startAt }` | Everyone builds the same maze and roles. `startAt` is a shared timestamp (ms) so clocks line up. |
| `pos` | Every client | `{ id, x, y, dir, t }` | 10 Hz position updates (only send when position changed). |
| `caught` | Nagavalli | `{ hiderId, t, order }` | A hider was caught. `order` counts from 1 (1 = first caught) up to the number of hiders. |
| `photo` | Photo owner | `{ ownerId, ownerName, dataUrl, kind }` | The captured photo. `kind` is `"caught"` or `"nagavalli_lost"`. |
| `game_end` | Host | `{ winner: "nagavalli" \| "hiders" }` | Round finished. |
| `back_to_lobby` | Any | `{}` | Resets everyone to the lobby. |

**Phase timing:** all phases are derived from `startAt` plus the config durations, so every client has the same timeline (head start, then chase, then end). The host sends `game_end` when the chase timer ends or when Nagavalli reports that all hiders are caught.

**Role assignment:** the host picks `nagavalliId` with `Math.random()` over the player IDs actually in the room (3 to 5) and broadcasts it in `game_start`.

**Rate limits:** the Supabase free tier allows about 100 realtime messages per second per project. At 10 Hz x 5 players (the maximum) = about 50 msg/s, which is within limits for one room; smaller rooms use less. Do not raise `SEND_RATE_HZ` above 10. Smooth remote players on screen with linear interpolation (lerp) between updates.

## 7. Maze

- Generated from the broadcast `seed` using a **seeded RNG** (e.g. mulberry32) so every client gets an identical maze.
- Algorithm: recursive backtracker (depth-first) on a `MAZE_COLS x MAZE_ROWS` grid, then remove roughly 8% of extra interior walls at random (seeded) to create loops so Nagavalli cannot trap players in dead ends forever.
- Tiles: `0` = floor, `1` = wall.
- **Spawns:** hiders spawn at N random floor tiles (N = players - 1) in the left half of the maze. Nagavalli spawns at the center tile. Spawn positions come from the host (`game_start`).
- Collision: axis-separated AABB checks against wall tiles. Players cannot pass through walls.
- Camera: the canvas camera follows the local player, centered, clamped to the maze bounds.

## 8. Vision / Darkness Rendering

Every frame, on the canvas:
1. Draw the maze floor, walls and **only the entities allowed to be seen**.
2. Draw a full-screen black overlay with a **circular hole** (radial gradient, soft edge) centered on the local player. Radius = `VISION_NAGAVALLI` or `VISION_HIDER`.
3. **Do not render** (and ideally skip drawing) any other player whose distance to the local player is greater than the vision radius. Do not rely on the overlay alone to hide them.
4. Optional flicker: vary the radius by +/- 1 px with a sine wave for a horror feel.
5. During Nagavalli's head start, render pure black plus the countdown text.

## 9. Controls (Desktop only)

- Move: **WASD** or **Arrow keys** (8 directions, normalize diagonal speed).
- No other inputs during the game.
- Movement is blocked when the phase is `ROLE_REVEAL`, the player is a caught hider, or it is Nagavalli's head start.

## 10. Catch Logic

- Only **Nagavalli's client** checks for catches each frame, during the chase phase only.
- A hider is caught when the distance between Nagavalli and the hider is less than `CATCH_DISTANCE`.
- On catch: Nagavalli's client broadcasts `caught { hiderId, order }` once per hider and increments her local counter.
- The caught hider's client receives the event, switches to the caught state and, **if `order === 1`**, captures a camera photo right then and broadcasts `photo`.
- When the counter reaches the number of hiders (N), Nagavalli's client tells the host and the host broadcasts `game_end { winner: "nagavalli" }`.

## 11. Camera Photo Capture

- Use the stream from Screen 0 attached to a hidden `<video autoplay playsinline muted>`.
- `capturePhoto()`: draw the current video frame to an offscreen canvas at **320x240**, export `canvas.toDataURL("image/jpeg", 0.6)`. This keeps the payload around 15-30 KB, which is safely under Supabase's broadcast payload limit (about 250 KB on the free plan).
- Mirror the image horizontally so it looks like a selfie.
- Trigger rules:
  - **First hider caught:** that hider's client captures on receiving its own `caught` event with `order === 1`.
  - **Nagavalli loses (time out):** Nagavalli's client captures **immediately** when the chase timer reaches 0 (or when it receives `game_end` with `winner: "hiders"`), then broadcasts `photo`.
- The result screen waits up to 3 seconds for the `photo` event; if it never arrives, show a fallback silhouette image with the same caption.
- For sharing, compose on a canvas: the photo, a red vignette/grain filter and the caption text burned in, then export a PNG/JPEG blob to share or download.
- Photos are held in memory only and are never uploaded anywhere except through the realtime broadcast.

## 12. Sprites

All sprite files live in `public/sprites/` (served at `/sprites/...`).

| File | Size | Description |
|---|---|---|
| `nagavalli.png` | 16x16 per frame, 4 frames x 4 directions sheet (or a single static 16x16 for MVP) | The seeker. Creepy long-haired ghost woman, pale with a red glow. |
| `hider_1.png` ... `hider_5.png` | 16x16 per frame, same layout as above | Five hider skins, pickable in the lobby. |
| `wall.png` | 16x16 | Dark stone/brick wall tile. |
| `floor.png` | 16x16 | Dark wooden or stone floor tile. |
| `caught_marker.png` | 16x16 | Optional, shown where a hider was caught. |

**Rules**
- If a sprite fails to load, draw a colored rectangle instead (Nagavalli = red, hiders = distinct colors, walls = dark gray) so the game is always playable.
- Preload all sprites before the game starts.
- Draw with `ctx.imageSmoothingEnabled = false`.

## 13. Project Structure

```
nagavalli/
├─ public/
│  └─ sprites/               # all sprite PNGs (see Section 12)
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx                # screen state machine
│  ├─ screens/
│  │  ├─ CameraGate.tsx
│  │  ├─ MainMenu.tsx
│  │  ├─ Lobby.tsx           # player selection
│  │  ├─ RoleReveal.tsx
│  │  ├─ GameScreen.tsx      # canvas + HUD, handles both roles
│  │  └─ Result.tsx
│  ├─ game/
│  │  ├─ config.ts
│  │  ├─ maze.ts             # seeded generation
│  │  ├─ engine.ts           # loop, movement, collision, catch detection
│  │  ├─ render.ts           # drawing + darkness mask
│  │  └─ input.ts            # keyboard handling
│  ├─ net/
│  │  ├─ supabase.ts         # client init
│  │  └─ room.ts             # channel join, presence, broadcast helpers
│  ├─ camera/
│  │  └─ capture.ts          # stream + capturePhoto + share helpers
│  └─ index.css              # tailwind + horror styles
├─ .env.example
├─ tailwind.config.js
├─ vite.config.ts
└─ PRD.md
```

## 14. Build Order (do it in this order)

1. **Scaffold:** Vite + React + Tailwind + Supabase client. Screen state machine in `App.tsx`.
2. **Camera Gate** (Screen 0) with a working permission flow.
3. **Main Menu + room join** via Supabase Presence (room key, name, max 5, lobby list).
4. **Lobby:** skin pick, ready toggles, host Start button, `game_start` broadcast.
5. **Maze generation** (seeded) + canvas rendering with colored placeholder tiles.
6. **Movement + collision** for the local player, camera follow.
7. **Position sync** (`pos` at 10 Hz) + interpolation of remote players.
8. **Darkness / vision** mask and hide-outside-radius logic.
9. **Phases and timers:** role reveal, 30 s head start (Nagavalli frozen and blacked out), chase timer.
10. **Catch logic**, HUD counters, caught/spectator state, win conditions, `game_end`.
11. **Photo capture, broadcast, Result screen,** download and share.
12. **Real sprites** from `public/sprites/`, horror styling, flicker, polish.
13. **Deploy** to Vercel (Section 16).

## 15. Edge Cases

- **Room full:** a 6th joiner is rejected with "Room full".
- **Join during a game:** rejected with "Game in progress".
- **Duplicate names:** allowed, but append `#2` etc. if the name matches one already in the room.
- **Player count drops mid-game:** the game continues as long as Nagavalli and at least one hider remain. If fewer than 2 players remain, end the round and return to the lobby.
- **A player disconnects mid-game:** if a hider leaves, count them as caught (no photo trigger unless they were the first). If Nagavalli leaves, hiders win by default and the photo falls back to the silhouette. If the host leaves, return everyone to the lobby.
- **Camera stream dies mid-game:** use the silhouette fallback image for the photo.
- **Tab hidden:** browsers throttle timers; derive time from `startAt` and `Date.now()` instead of counting frames.
- **Invalid room key:** show "Room not found" if presence is empty and the user chose Join.

## 16. Deployment (Vercel)

1. Push the repo to GitHub.
2. In Vercel: **New Project**, import the repo (framework preset: Vite).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in **Project Settings > Environment Variables**.
4. Deploy. Build command `npm run build`, output directory `dist`.
5. In Supabase: enable **Realtime** (on by default). No tables, no RLS setup needed for Broadcast and Presence on public channels.
6. Open the deployed URL in 5 browser windows/devices, create a room in one, join with the key in the others.

## 17. Acceptance Criteria (MVP is done when)

- [ ] The game does not proceed past Screen 0 until the camera is allowed.
- [ ] Up to 5 players can join the same room with a key; a 6th is rejected.
- [ ] Skins can be picked; the host can start only when at least 3 players are present and all are ready (works with 3, 4 and 5 players).
- [ ] One random player becomes Nagavalli; everyone sees the same maze.
- [ ] Hiders get a 30-second head start while Nagavalli sees a black screen and cannot move.
- [ ] Every player sees only a small light circle around themselves, and other players are not rendered outside it.
- [ ] Positions of all players sync in real time (about 10 Hz) and the movement looks smooth.
- [ ] Nagavalli catching a hider (distance < 10 px) removes that hider from play and updates counters.
- [ ] Nagavalli wins when all hiders are caught (2, 3 or 4 depending on room size); the first caught hider's photo is taken at the catch moment and shown to every player in the room.
- [ ] Caught hiders can spectate through other players' light circles with Tab or the arrow keys.
- [ ] Hiders win when time runs out; Nagavalli's photo is taken instantly and shown to every player in the room.
- [ ] The Result screen allows Download and Share.
- [ ] Sprites load from `public/sprites/` with colored fallbacks if missing.
- [ ] The app deploys on Vercel and works with two or more real devices.

## 18. Future Ideas (Not in MVP)

Sound effects and heartbeat that speeds up as Nagavalli gets close, jump-scare flash on catch, hiding spots (lockers), items (flashlight boost), mobile touch controls, multiple maze themes, rematch voting.
