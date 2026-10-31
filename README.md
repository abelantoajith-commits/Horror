# NAGAVALLI — Multiplayer Horror Hide & Seek 🕯️👻

A real-time multiplayer horror hide-and-seek browser game built with **React 18 + Vite + TypeScript**, **HTML5 Canvas 2D (pixelated)**, **Tailwind CSS**, and **Supabase Realtime (Broadcast + Presence)**.

---

## 1. Game Overview & Rules

- **Players:** 3 to 5 players per room (minimum 3 required to start, maximum 5).
- **Roles:** One random player becomes **Nagavalli** (the seeker); all other players are **Hiders**.
- **Darkness & Vision:** The entire dungeon is pitch black. Every player only sees through a tight, flickering circle of light centered on their own character. Distant players outside your light radius are strictly invisible (not rendered).
- **Phases:**
  1. **Role Reveal (3 seconds):** Dramatic title card showing `"YOU ARE NAGAVALLI"` in red or `"HIDE."` in white.
  2. **Head Start (30 seconds):** Nagavalli is frozen on a black screen with a countdown ("She is counting..."). Hiders move freely to find hiding spots in the maze.
  3. **The Chase (180 seconds):** Nagavalli hunts the hiders.
- **Catch & Spectating:**
  - Nagavalli catches a hider when within 10 px.
  - Caught hiders enter spectator mode to view the game through remaining alive players' light circles. Press `Tab` or `ArrowLeft`/`ArrowRight` to switch who you watch.
- **Webcam Photo Capture:**
  - **Nagavalli Wins (all hiders caught):** A selfie photo is captured of the **first hider caught** at the moment of their capture.
  - **Hiders Win (time expires):** A selfie photo is captured of **Nagavalli** at the moment time runs out.
  - The photo is broadcast to every player's screen on the **Result Screen**, where anyone can **Download** or **Share** with custom horror filters.

---

## 2. Prerequisites

- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **Webcam / Camera:** Required by the Camera Gate. (A virtual stream fallback is provided for testing or devices without a webcam).
- **Supabase Account (Free Tier):** For multi-device cloud synchronization.
  *(Note: For local same-machine multi-tab testing, built-in BroadcastChannel fallback works seamlessly even without Supabase credentials).*

---

## 3. Supabase Project Setup

1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. In your Supabase project dashboard:
   - Go to **Project Settings** > **API**.
   - Copy **Project URL** (e.g., `https://xyzproject.supabase.co`).
   - Copy **Project API Key** (the `anon` / `public` key).
3. Supabase Realtime is enabled by default. No database tables or Row-Level Security (RLS) rules are needed—the game runs entirely over Realtime Broadcast and Presence.

---

## 4. Environment Variables

Create `.env.local` in the project root (or copy from `.env.example`):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 5. Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local Vite dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
4. To test with 3+ players locally, open 3 tabs in your browser, allow the camera, create a room in Tab 1, and join using the 6-character room code in Tabs 2 and 3.

---

## 6. Where to Put Sprite Files

All sprite files are located in `public/sprites/` and served at `/sprites/{name}.png`:

| File | Size | Description |
|---|---|---|
| `public/sprites/nagavalli.png` | 16x16 px | Nagavalli seeker ghost (pale face, black hair, glowing red eyes) |
| `public/sprites/hider_1.png` | 16x16 px | Blue hider character skin |
| `public/sprites/hider_2.png` | 16x16 px | Green hider character skin |
| `public/sprites/hider_3.png` | 16x16 px | Amber hider character skin |
| `public/sprites/hider_4.png` | 16x16 px | Pink hider character skin |
| `public/sprites/hider_5.png` | 16x16 px | Violet hider character skin |
| `public/sprites/wall.png` | 16x16 px | Dark dungeon stone wall tile |
| `public/sprites/floor.png` | 16x16 px | Dark floor tile |
| `public/sprites/caught_marker.png` | 16x16 px | Caught position marker |

> **Fallback guarantee:** If any sprite file is missing or fails to load, the game renders colored pixel-art fallback rectangles so gameplay is never interrupted.

---

## 7. Deploying to Vercel

1. Push this repository to GitHub.
2. Go to [https://vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
5. Click **Deploy**.
6. Share your Vercel deployment URL (`https://your-app.vercel.app`) with friends to play across devices over HTTPS!

---

## 8. Controls (Desktop Only)

- **Movement:** `W, A, S, D` or `Arrow Keys` (8 directions, normalized diagonal speed).
- **Spectator Cycling:** When caught, press `Tab` or `ArrowLeft` / `ArrowRight` to cycle between alive players to spectate.
