# Telefunken — Peru v1 (Contract Rummy)

## Project Purpose

Telefunken is a single-page web game implementing **Peru Version 1**, a rummy-style contract card game for four players: one human and three AI opponents. The game plays out over six deals, each with escalating contract requirements. At the end of all six deals, the player with the lowest total score wins.

**Core pillars:**
- Complete rule fidelity to Peru v1 (with documented deviations below)
- Deterministic replay via seeded RNG — every match is reproducible
- Zero framework dependency — vanilla TypeScript + DOM

---

## Architecture & Tech Stack

### Tech stack

| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | ^7.0.2 | All source code |
| Vite | ^8.1.5 | Build tooling, dev server |
| Vitest | ^4.1.10 | Unit testing (native) |
| ESLint | ^10.7.0 | Linting |
| JS/TS globals | via `globals` package | Environment globals config for ESLint |

### Module structure

```
src/
├── ui.ts                         # DOM rendering, event wiring, controls, toasts, overlays
└── game/
    ├── index.ts                  # Public barrel — all exports surface here
    ├── types.ts                  # Shared types: Suit, CardRank, MeldType, GameState, Contract, StateEvent, MessagesOut
    ├── card.ts                   # Card class (id, suit, rank, pointValue computed)
    ├── deck.ts                   # Double-deck (108 cards), shuffle, seeded PRNG draw
    ├── meld.ts                   # Meld class (set/run, wildCount, isContract, removeJoker)
    ├── validators.ts             # isValidSet(), isValidRun() — pure functions
    ├── contracts.ts              # CONTRACTS array for all 6 deals (e.g., [2×3, 1×4, 2×4, 1×5, 2×5, 1×6])
    ├── utils.ts                  # createRng (Mulberry32), sortByRank, sortBySuit
    ├── players/
    │   └── player.ts             # Player class (id, name, chips, score, hand, hasMelded)
    ├── activity-log/
    │   ├── entry.ts              # ActionLogEntry + rendering helpers
    │   └── log-manager.ts        # ActivityLog — event log for UI feed
    └── engine/
        ├── game-core.ts          # Game class — state machine (init → discard → draw → meld → buyDiscard → dealover → gameover)
        ├── ai.ts                 # AI decisions: evaluateMelds, aiDiscardSelection, aiWantsDiscard, advanceBuyDiscardPrompt
        └── scoreboard.ts         # Pure functions: scoreDeal(), endGame(), getLeaderboard()
```

### Architectural principles

- **Game engine is presentation-free.** `src/game/` has zero dependency on DOM or browser APIs. It communicates via the `MessagesOut` callback interface (`onStateChanged`, `onMessage`). Every class and method in `src/game/` is testable in Node.js / Vitest.
- **The UI layer owns all DOM interaction.** Rendering, card selection, buttons, activity log, toasts, overlays (new game, game over, discard-buy) are all in `src/ui.ts`. The UI subscribes to game events via `onStateChanged` callbacks and re-renders accordingly.
- **AI is pure logic with no side effects.** `ai.ts` receives read-only state (hand ids, allCards registry) and returns decisions. All AI-driven turns flow through `Game.aiPlayTurn()`. The AI evaluates melds by finding sets first (rank match), then runs (consecutive same-suited cards bridged by wilds as needed).
- **Seeded RNG guarantees determinism.** Every deal uses a seeded Mulberry32 PRNG. The same seed always produces an identical game, critical for debugging and replayability. Seed input accepts string or number; null/empty generates a random game.
- **Contracts govern the six deals.** Players must satisfy specific `count × minSize` set requirements on each deal:
  - Deal 1: 2 sets of at least 3
  - Deal 2: 1 set of at least 4
  - Deal 3: 2 sets of at least 4
  - Deal 4: 1 set of at least 5
  - Deal 5: 2 sets of at least 5
  - Deal 6: 1 set of at least 6
  - Runs cannot satisfy the *initial* first meld contract (Peru v1 rule). After a player's first meld, additional melds (sets or runs) may be played freely.
- **Minimal, focused modules.** Each file has a single responsibility. There are no god classes — `Game` orchestrates flow but delegates scoring to `scoreboard.ts` and AI logic to `ai.ts`.

---

## Process & Expectations

### Review gate — adversarial review required for every feature

**No feature is complete until it has passed an adversarial review.** Every change must be evaluated by the built-in [adversarial reviewer](.opencode/agents/adversarial-reviewer.md) agent, which aggressively hunts for:

- Logical errors, race conditions, blind spots
- Unaccounted edge cases or bad assumptions
- Missing validation, error handling, or input sanitization
- Architecture decisions that will become technical debt
- Environment, dependency, or behavior assumptions that may break in production

A feature lands **only** when the adversarial review concludes with an **APPROVE** (or APPROVE WITH conditions that all get resolved). Rejected changes must be fixed and re-submitted.

### Quality gates — zero tolerance for errors or warnings

Every change must pass the following four gates, **all with zero errors and zero warnings**, before it is considered viable:

```
pnpm test           # Vitest — all 195 tests pass; no failures
pnpm typecheck      # tsc --noEmit — zero type errors
pnpm lint           # ESLint — zero warnings, zero errors
pnpm build          # Vite build — zero issues in production bundle
```

- **Tests:** unit tests cover every new behavior and edge case. Tests are deterministic where applicable (seeded RNG). No DOM/mock dependencies unless a test genuinely requires them.
- **Typecheck:** all code must be type-safe. No `any` — use `unknown` when the shape is truly dynamic. All imports must resolve; unused imports must be removed.
- **Linter:** zero output from ESLint. This includes fixing pre-existing issues in any file you touch and ensuring no new violations are introduced.
- **Build:** Vite production build succeeds without warnings or errors.

**Do not commit, do not merge, and do not declare anything complete unless all four gates pass.** If a gate fails, fix it before proceeding — that is your next step.

### Other conventions

- Write descriptive commit messages that explain *why*, not just *what*.
- Prefer small, focused changes. Each PR/commit addresses one feature or fix.
- Follow existing code style: no comments unless necessary for non-obvious logic; no emojis in source files; spreads over in-place mutation for clarity.
- Keep the game engine completely decoupled from the DOM — that boundary is sacred.

---

## Peru v1 Rule Deviations / Reference

Quick reference for rules where Peru v1 differs from base rummy/contract rummy conventions. Easy to get wrong — verify before changing any game logic:

- **6 deals only** (not 7). Contracts: `2×3, 1×4, 2×4, 1×5, 2×5, 1×6`
- **Dealer gets 12 cards**, discards as first action — no face-up starter card
- **No discard-before-play** on any deal
- **Jokers wild only in runs** (never in sets). In every run: `wildCount <= naturalCount`
- Joker swap costs exactly **1** natural card (not 2)
- **Final discard mandatory** to go out — melding to zero cards is illegal; you must have a card left to discard
- **Stock exhaustion → immediate deal end** (discard pile is NOT reshuffled)
- Ace can wrap in runs: K-A-2 is valid
- Buying from discard costs 1 chip + draws extra cards. Post-meld buy is blocked
- Human buy button usable outside their turn; AI bots never buy
- **Scoring:** 3-9 = face value, 10-K = 10, Ace = 15, Two/Joker = 20. End-game: -10 pts per unused chip

---

## Card Data Conventions

- **Ranks stored as** `2`–`14` with `'joker'`. Joker rank = `'joker'`, suit = `'joker'`
- **Suits:** `'hearts'`, `'diamonds'`, `'clubs'`, `'spades'`, `'joker'`
- **Player IDs:** 0 = human, 1–3 = AI bots
- **Game states:** `'init' | 'discard' | 'draw' | 'meld' | 'buyDiscard' | 'dealover' | 'gameover'`
- **Meld types:** `'set'` (same rank, different suits) or `'run'` (consecutive same suit)

---

## Quick Start

```bash
pnpm install
pnpm dev          # Vite dev server
pnpm test         # Vitest tests
pnpm build        # Production build to dist/
```
