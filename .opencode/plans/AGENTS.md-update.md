# AGENTS.md

## What Is This Project

Single-page Telefunken web game (contract rummy, **Peru Version 1** rules). 4 players: P0 = human, P1-P3 = AI bots. No frameworks — vanilla HTML/CSS/JS with ES modules + Jest for tests.

## Plan File

The authoritative implementation plan lives at `.opencode/plans/telefunken-peru-v1.md`. Read it before making structural changes.

## Commands

```bash
npm test            # Run Jest (ESM mode required)
```

No build step, no bundler, no linter, no type checker. Serve `index.html` directly from any static server or file://.

## File Boundaries

| File | Responsibility |
|------|----------------|
| `game.js` | All game logic (Card, Deck, Meld, Player, Game classes + pure validators). Browser UI init guarded by `typeof window !== 'undefined'`. ES module exports only. |
| `tests/game.test.js` | Jest ESM tests importing directly from `game.js` |
| `index.html` | Entry point, references `game.js` as `type="module"` and `styles.css` |
| `styles.css` | All UI styles |

## Peru v1 Rules (Deviations from Base Rules)

These are easy to get wrong — reference them before any game-logic change:

* **6 deals only** (not 7). Contracts: 2×3, 1×4, 2×4, 1×5, 2×5, 1×6
* **Dealer gets 12 cards**, discards as first action — no face-up starter card
* **No discard-before-play** on any deal
* **Jokers wild only in runs** (never in sets). In every run: `wildCount <= naturalCount`
* Joker swap costs exactly **1** natural card (not 2)
* **Final discard mandatory** to go out — melding to zero cards is illegal
* **Stock exhaustion → immediate deal end** (discard pile is NOT reshuffled)
* Ace can wrap (K-A-2 valid in runs)
* Player buys cost: 1 chip + draw extra card(s). Post-meld buy is blocked
* Human buy button usable **outside** their turn; AI bots **never** buy
* Scoring: 3-9=face, 10-K=10, Ace=15, Two/Joker=20. End-game: -10 pts per unused chip

## Testing

Jest must run with `--experimental-vm-modules` for ESM imports. Do not add DOM or jsdom mocks unless a specific test genuinely needs them — core logic is pure and should test without any platform layer.

## Conventions

* Card ranks stored as 2-14 (A=14, K=13, Q=12, J=11). Joker rank = `'joker'`
* Suits: `'hearts'`, `'diamonds'`, `'clubs'`, `'spades'`, `'joker'`
* Player IDs: 0 = human, 1-3 = AI bots
