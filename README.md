# ⚡ Quizzer

A multiplayer trivia quiz app built with Astro, React, and PartyKit. Solo and real-time multiplayer modes, powered by the Open Trivia Database.

**Live site**: [jonasnico.github.io/quizzer](https://jonasnico.github.io/quizzer)

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Astro + React (TypeScript) |
| Styling | Tailwind CSS + CSS custom properties |
| Multiplayer | [PartyKit](https://www.partykit.io/) (real-time WebSockets) |
| Questions API | [Open Trivia Database](https://opentdb.com/) |
| Frontend hosting | GitHub Pages (static) |
| Multiplayer server | partykit.dev (Cloudflare Workers) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A free [PartyKit account](https://www.partykit.io/) (for multiplayer)

### Installation

```bash
git clone https://github.com/jonasnico/quizzer.git
cd quizzer
pnpm install
```

### Environment

Create a `.env` file (already included, do not commit secrets):

```bash
# Local PartyKit dev server (default)
PUBLIC_PARTYKIT_HOST=localhost:1999
```

---

## Running Locally

Multiplayer requires **two** terminals running simultaneously.

**Terminal 1 — Astro frontend:**

```bash
pnpm dev
# → http://localhost:4321
```

**Terminal 2 — PartyKit server:**

```bash
pnpm partykit dev
# → ws://localhost:1999
```

Solo quiz works with only Terminal 1. Terminal 2 is needed for the `/multiplayer` route.

---

## Deploying to Production

### Frontend — GitHub Pages

The frontend deploys automatically on every push to `main` via GitHub Actions.

You **must** set the `PUBLIC_PARTYKIT_HOST` variable in your GitHub repo so the production build knows where the PartyKit server lives:

1. Go to your repo → **Settings → Variables and secrets → Actions**
2. Under **Variables** (not secrets), add:
   - Name: `PUBLIC_PARTYKIT_HOST`
   - Value: `quizzer.YOUR-PARTYKIT-USERNAME.partykit.dev`

> **Yes — the frontend stays on GitHub Pages.** PartyKit is a separate service and only handles WebSocket connections. The static Astro build on GitHub Pages points to it via the env variable.

### PartyKit Server — partykit.dev

Deploy the multiplayer server:

```bash
# Log in once
pnpx partykit login

# Deploy (uses partykit.json for config)
pnpx partykit deploy
```

After deploying, PartyKit will output your server URL:

```
https://quizzer.YOUR-USERNAME.partykit.dev
```

Set this as `PUBLIC_PARTYKIT_HOST` in both:
- Your `.env` (strip `https://`, keep only the host): `quizzer.YOUR-USERNAME.partykit.dev`
- GitHub repo → Settings → Variables → `PUBLIC_PARTYKIT_HOST`

Then push to `main` — the GitHub Action will rebuild the frontend with the production host baked in.

---

## Project Structure

```
quizzer/
├── party/
│   └── index.ts          # PartyKit server (multiplayer game logic)
├── src/
│   ├── components/
│   │   ├── QuizConfig.astro      # Solo quiz config (Astro + vanilla JS)
│   │   ├── QuizGame.tsx          # Solo quiz gameplay (React)
│   │   ├── QuizReview.tsx        # Solo answer review (React)
│   │   └── MultiplayerApp.tsx    # Full multiplayer UI (React + PartySocket)
│   ├── layouts/
│   │   └── Layout.astro          # Global page shell + nav
│   ├── pages/
│   │   ├── index.astro           # Home / solo quiz config
│   │   ├── quiz.astro            # Solo quiz gameplay
│   │   ├── review.astro          # Solo answer review
│   │   └── multiplayer.astro     # Multiplayer lobby + game
│   ├── types/
│   │   └── index.ts              # Shared types (solo + multiplayer)
│   └── utils/
│       ├── api.ts                # OpenTDB API client
│       └── styles.ts             # Answer button style constants
├── partykit.json                 # PartyKit config (name + entry point)
├── .env                          # LOCAL env vars (do not commit secrets)
└── astro.config.mjs
```

---

## Multiplayer Flow

1. **Host** visits `/multiplayer`, enters name → creates a room → gets a 6-character code
2. **Players** enter name + room code → join the lobby
3. Host configures the quiz (questions, category, difficulty, type) and starts the game
4. All players see the **same question simultaneously** with a **20-second countdown**
5. Answering early locks in your answer; timer expiry reveals the answer for everyone
6. After each question: correct answer revealed + live leaderboard shown
7. Host advances to the next question
8. Final podium after all questions

---

## Available Scripts

```bash
pnpm dev              # Start Astro dev server
pnpm build            # Production build
pnpm preview          # Preview the build locally
pnpm partykit dev     # Start PartyKit WebSocket server (dev)
pnpx partykit deploy  # Deploy PartyKit server to partykit.dev
```

