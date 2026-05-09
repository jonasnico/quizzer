# Copilot Instructions for Quizzer

This is an Astro trivia quiz application with React components and real-time multiplayer support via PartyKit. It uses the Open Trivia Database API (https://opentdb.com/) for questions.

## Project Structure and Guidelines

- **Framework**: Astro (static output, deployed to GitHub Pages)
- **Frontend interactivity**: React with TypeScript — used only where truly needed
- **Multiplayer**: PartyKit (WebSocket server at `party/index.ts`, client via `partysocket`)
- **Styling**: Tailwind CSS + CSS custom properties (design system in `src/styles/global.css`)
- **Package manager**: pnpm
- **API**: Open Trivia Database (https://opentdb.com/)

## Astro vs React Guidelines

Prefer Astro components. Only use React (`.tsx`) when the component requires:
- Complex or real-time interactive state (e.g., quiz gameplay, multiplayer lobby)
- WebSocket connections
- Lifecycle hooks / side effects that span the component

| Component | Framework | Why |
|-----------|-----------|-----|
| `QuizConfig.astro` | Astro + vanilla JS | Simple form + fetch, no complex state |
| `QuizGame.tsx` | React | Interactive game state |
| `QuizReview.tsx` | React | Reads sessionStorage, conditional render |
| `MultiplayerApp.tsx` | React | Real-time WebSocket, multi-phase state |
| `Layout.astro` | Astro | Static shell |

## Design System

The app uses an **"Arcade Showdown"** dark game-show aesthetic. CSS custom properties are defined in `src/styles/global.css`:

- `--color-gold: #F5A623` — primary accent
- `--color-cyan: #00D4E4` — secondary accent
- `--color-green: #00CF72` — correct answers
- `--color-red: #FF2D55` — wrong answers
- `--font-display: "Bebas Neue"` — headings
- `--font-mono: "Space Mono"` — scores, codes, timers
- `--font-body: "Outfit"` — body text

Use the defined CSS classes (`.card`, `.btn-primary`, `.btn-secondary`, `.answer-btn`, `.score-display`, `.label`, `.room-code`, `.difficulty-*`) rather than raw Tailwind for components. Tailwind utilities are still available for layout/spacing.

## Multiplayer Architecture

- `party/index.ts` — PartyKit server. Manages room state, players, quiz phases (`lobby | question | answer_revealed | ended`), timers. Do not add browser APIs here.
- `src/components/MultiplayerApp.tsx` — React client. Uses `partysocket` (WebSocket wrapper). Handles all multiplayer phases in one component.
- `src/types/index.ts` — Shared types used by both client and server (`MultiplayerGameState`, `Player`, `ServerMessage`, `ClientMessage`, etc.)
- Environment: `PUBLIC_PARTYKIT_HOST` — set to `localhost:1999` for dev, `quizzer.USERNAME.partykit.dev` for production

## Key Features

### Solo Quiz
1. Configure questions (amount, category, difficulty, type) on home page
2. Questions fetched from OpenTDB, stored in `sessionStorage`
3. Gameplay in `/quiz`, review in `/review`

### Multiplayer Quiz
1. Host creates room (gets 6-char code), players join with code
2. Host configures and starts the game — questions fetched from OpenTDB
3. Synchronized gameplay: all players see same question, 20-second timer
4. After all answers in (or timer expires): answer revealed, scores updated
5. Host advances to next question; final leaderboard at the end

## Code Style

- **NO COMMENTS** in code — use clear variable and function names instead
- TypeScript everywhere
- Prefer `const` and arrow functions
- No default exports from utility files — only from components
- `sessionStorage` keys are constants in `src/types/index.ts` (`STORAGE_KEYS`)

## API Response Format

```typescript
interface TriviaQuestion {
  category: string;
  type: "multiple" | "boolean";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}
```

HTML entities in questions/answers must be decoded (done in `TriviaAPI.fetchQuestions`).

## Running Locally

```bash
pnpm dev              # Astro frontend (port 4321)
pnpm partykit dev     # PartyKit server (port 1999) — needed for multiplayer
```

## Deployment

- **Frontend**: GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)
- **Multiplayer server**: `pnpx partykit deploy` → `quizzer.USERNAME.partykit.dev`
- Set `PUBLIC_PARTYKIT_HOST` as a GitHub Actions **variable** (not secret) for production builds
