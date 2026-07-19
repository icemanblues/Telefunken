# Telefunken — Peru Version 1 Web Implementation Plan & Build Tasks

## Overview

Build a playable 4-player Telefunken card game (contract rummy, Peru v1 rules) as a single-page web app with AI bots, a scoreboard, round indicator, and human-interaction buttons. Player 0 = human. Players 1-3 = simple AI bots.

---

## Final File Structure

```
/home/roland/code/Telefunken/
├── index.html              # references styles.css, game.js (ES module)
├── styles.css              # all game UI styles
├── game.js                 # ES module exports: Card, Deck, Meld, Player, Game + pure validators. Browser UI init guarded by typeof window check.
├── tests/
│   └── game.test.js        # Jest unit tests (imports from game.js)
├── package.json            # {"type":"module"}, jest + jsdom devDeps, test script
├── common-rules.md         # existing
├── country-variations.md   # existing
└── README.md               # existing
```

---

## Peru v1 Rules (Summary)

### Deck & Setup
- **Deck**: 2× standard 52 + 4 jokers = 108 cards
- **Deal**: 11 cards each. Dealer gets 12th card, then discards as first action (no face-up starter card).
- **Chips**: 6 per player
- **Wilds**: Jokers wild **only in runs** (never in sets). In any run, number of wilds ≤ number of natural cards. Joker swap costs exactly 1 natural card.

### Contracts (6 deals, no deal 7)
| Deal | Contract |
|------|----------|
| 1 | 2 sets of 3 |
| 2 | 1 set of 4 |
| 3 | 2 sets of 4 |
| 4 | 1 set of 5 |
| 5 | 2 sets of 5 |
| 6 | 1 set of 6 |

### Gameplay
- No discard-before-play phase on any deal
- Final discard mandatory to go out (cannot meld all cards at once)
- Stock exhaustion → deal ends immediately (no reshuffle of discard pile)
- Ace can be high/low/wrapping (K-A-2 valid in runs)
- Players who have not yet melded this deal can buy the top discard: costs 1 chip + draws 1 extra card (2 if buying on own turn). Once a player has melded, they cannot buy.
- Human's buy button usable outside their turn

### Scoring
| Card | Points |
|------|--------|
| 3–9 | Face value |
| 10–K | 10 |
| Ace | 15 |
| Two / Joker | 20 |

- Player who went out scores 0 for that deal
- Cumulative penalty tracking across all 6 deals
- End-game bonus: **-10 pts per unused chip** remaining
- Lowest total score wins

---

## Architecture

### ES Module Pattern (game.js)

All classes and validators are named exports. Browser UI initialization is guarded so Jest can import without DOM.

```js
export class Card { ... }
export class Deck { ... }
export class Meld { ... }
export class Player { ... }
export class Game { ... }
export function isValidSet(cards: Card[]): boolean;
export function isValidRun(cards: Card[], wildCards: Card[]): boolean;

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => initUI());
}
```

### Core Classes

**Card** — `id` (unique string), `suit` ('hearts'|'diamonds'|'clubs'|'spades'|'joker'), `rank` (2-14 where 11=J, 12=Q, 13=K, 14=A; or 'joker')

**Deck** — constructor creates 108 cards, `shuffle()` via Fisher-Yates, `draw()`, `.cards` array, `.remaining` count

**Meld** — `type` ('set'|'run'), `owner` (player index 0-3), `cards: Card[]`, `isContract: boolean`. Methods: `canAdd(card)`, `add(card)`, `removeJoker(cardId)`

**Player** — `id` (0-3), `name`, `isHuman` (bool), `hand: string[]` (card IDs), `chips` (init 6), `score` (cumulative penalty), `hasMelded` (per-deal flag)

**Game** — state machine:
- State: `deal` (1-6), `deck`, `discardPile` (stack of card IDs), `players[]`, `tableMelds[]`, `currentPlayerIndex`, `phase` ('draw'|'meld'|'discard'|'dealing'|'dealover'|'gameover')
- Flow methods: `startDeal()`, `drawFromStock(playerId)`, `buyDiscard(playerId)`, `playMeld(playerId, cardIds, type)`, `addToExistingMeld(playerId, meldIdx, cardIds)`, `discardCard(playerId, cardId)`, `endTurn(playerId)`, `checkGameOver()`, `scoreDeal()`, `endGame()`
- Validation: contracts, meld rules, scoring

---

## Browser UI (index.html + styles.css)

### Layout Overview
```
┌──────────────────────────────────────────────┐
│  ROUND INDICATOR: Deal #3 | Contract: 2×4   │
├──────────────────────────────────────────────┤
│  SCOREBOARD                                  │
│  P1(You) Hand:8 | Buys:6 | Score:0 | ACTIVE │
│  P2(AI)  Hand:?  | Buys:6 | Score:15        │
│  P3(AI)  Hand:?  | Buys:5 | Score:5         │
│  P4(AI)  Hand:?  | Buys:6 | Score:20        │
├──────────────────────────────────────────────┤
│           TABLE MELDS AREA                   │
│    (All melds face-up, labeled by owner)     │
│          Stock Pile | Discard Top Card       │
├──────────────────────────────────────────────┤
│  Human Hand (clickable Unicode cards)        │
│  [Confirm Set] [Confirm Run]                 │
│  [Add to Meld ▼] [End Turn]                  │
│  [Buy Card] ← always visible when eligible   │
└──────────────────────────────────────────────┘
```

### UX Details
- Cards use Unicode suits (♠♣♥♦), CSS colors for red/black
- Selected cards get highlighted border/background
- AI hands shown as face-down card-count only
- Toast messages for validation errors
- Buy button always visible when player hasn't melded and has chips

---

## AI Bot Behavior

Simple strategy per turn (800ms delay between bots):
1. Always draw from stock
2. Scan hand for valid set matching contract → play it
3. If already melded, scan for any new valid set/run/add-to-meld
4. Random discard from remaining hand
5. Never buys

---

## Jest Test Plan

Tests all exported classes and pure validation functions:
- Card/Deck construction (108 cards), shuffle, draw
- `isValidSet` — natural-only sets, rejects jokers
- `isValidRun` — wild limits, ace wrapping, consecutive checks
- Meld add/remove logic
- Contract satisfaction for all 6 deals
- Game flow: buying costs chip, post-meld buy blocked, final discard required, stock exhaustion ends round
- Scoring: penalty values, unused-chip bonus

---

## Build Tasks (Agent Handoff)

Below are the sequential tasks to hand off to a build agent. Each task is independent enough to verify before moving on.

### Task 1: Project Setup + package.json
- Create `package.json` with `"type": "module"`, Jest as devDependency, jsdom as devDependency, test script (`"test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"`)
- Create `tests/` directory

### Task 2: Core Card & Deck Classes (game.js)
- Implement `Card` class with id, suit, rank
- Implement `Deck` class: constructor builds 108 cards (2×52 + 4 jokers), Fisher-Yates shuffle, draw method
- Export both as ES modules

### Task 3: Meld Validation Functions + Meld Class
- Implement pure `isValidSet(cards[]): boolean` — 3+ naturals same rank, no wilds allowed
- Implement pure `isValidRun(cards[], wildCards[]): boolean` — consecutive same suit, wild count ≤ natural count, ace wraps
- Implement `Meld` class: type, owner, cards array, add/remove logic

### Task 4: Player Class + Game State Machine
- Implement `Player` class
- Implement `Game` class with full state machine: startDeal(), drawFromStock(), buyDiscard(), playMeld(), addToExistingMeld(), discardCard(), endTurn(), checkGameOver(), scoreDeal(), endGame()
- Implement contract rules for all 6 Peru v1 deals
- Implement scoring (Peru v1 card values + unused-chip bonus)
- Implement stack-exhaustion → immediate deal-end rule

### Task 5: HTML + CSS UI Skeleton
- Create `index.html` referencing `game.js` as `type="module"` and `styles.css`
- Create `styles.css` with layout for scoreboard, round indicator, tableau area, stock/discard piles, human hand, control buttons
- Wire up browser-init section in `game.js` to render: scoreboard table, empty meld area, shuffled deck, dealt hands

### Task 6: Human Player Interaction
- Card click-to-select toggle on human hand cards (highlight CSS class)
- `[Confirm Set]` button → calls `isValidSet`, places meld or shows toast error
- `[Confirm Run]` button → calls `isValidRun`, places meld or shows toast error
- `[Add to Meld ▼]` dropdown listing targetable existing melds → select cards → confirm
- `[Buy Card]` button (always visible when eligible) → triggers buyDiscard for player 0
- `[End Turn]` button → enters discard sub-phase → select 1 card → confirm discard → pass turn

### Task 7: AI Bot Integration
- In `Game.endTurn()` for AI players, auto-play bot logic with 800ms delay
- Bot draws from stock
- Bot scans hand for contract-matching set (or any valid meld if already melded)
- Bot attempts add-to-meld on table
- Bot discards random card from hand

### Task 8: Game Flow Wiring + Animations
- End-deal → score → update scoreboard → next deal
- End-game → display final scores with chip bonuses, show winner
- Add CSS transitions/animations for draw/discard/meld actions
- Round indicator updates each deal

### Task 9: Jest Unit Tests (tests/game.test.js)
- Import exported classes and validators from `game.js`
- Test Card/Deck (108 cards, shuffle randomness, draw exhaustion)
- Test meld validation (sets reject jokers, run wild limits, ace wrapping K-A-2)
- Test contracts for all 6 deals
- Test game flow (buying, post-meld buy blocked, final discard required, stock exhaustion)
- Test scoring values and chip bonus
- Verify `npm test` passes

---

## Important Rules to Remember During Implementation

1. Peru v1 = **6 deals only** (no deal 7)
2. Dealer gets **12 cards**, discards as first action (no face-up starter)
3. **No discard-before-play** on any deal
4. Jokers are wild **only in runs, never in sets**. Wilds ≤ naturals in each run.
5. Joker swap = 1 natural card exchanged
6. Final **discard mandatory** to go out (meld-to-zero is illegal)
7. Stock exhaustion → immediate deal end, **no reshuffle**
8. Human buy button works outside their turn
9. AI bots never buy, play simple meld-if-possible + random discard
