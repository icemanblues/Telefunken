# UI Svelte Migration Plan — Peru v1 → Svelte 5 + Tailwind CSS + PWA

> **Goal:** Convert the presentation layer from vanilla TS/DOM into Svelte 5 + Tailwind CSS, adding minimal-PWA support (manifest + service worker). Game engine remains untouched Typescript.
>
> **Migration strategy:** Incremental — each phase is independently buildable and passes all gates, then the next phase builds on top.

---

## Phase A — Scaffold Svelte 5 + Tailwind v4 + One Card Component

<!-- Status: PENDING -->
<!-- Start: -->
**Gates:** `[ ] test [ ] typecheck [ ] lint [ ] build`
**Adversarial:** `[ ] APPROVED BY`

### A1 — Install dependencies

```sh
pnpm add svelte@next
pnpm add -D @sveltejs/vite-plugin-svelte @tailwindcss/vite tailwindcss postcss
```

Verify: `npm ls svelte | grep "svelte@5"`, `npm ls tailwindcss | grep "tailwindcss@4"`

### A2 — Create `postcss.config.mjs`

Contents:
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

### A3 — Update `vite.config.ts` to add two plugins (keep existing config)

Add `'@sveltejs/vite-plugin-svelte'` and Tailwind import plugin to the `plugins:` array. Keep any existing Vite config intact (e.g., `build.target`, server options).

```ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),       // new
    svelte(),            // new
    // ... rest of existing config
  ],
});
```

### A4 — Create `tailwind.config.mjs`

Minimal config with content paths, custom Svelte variants:

```mjs
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{svelte,ts,html}', './index.html'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### A5 — Create `svelte.config.js`

Svelte 5 config for TypeScript + runes:

```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  compilerOptions: {
    css: 'injected', // scoped CSS per component
  },
};
```

### A6 — Create `tsconfig.json` Svelte settings additions (merge into existing)

Ensure your existing `tsconfig.json` has `compilerOptions.types` including `'svelte'`:

```json
"compilerOptions": {
  "types": ["vite/client", "svelte"],
  ...}
```

Add to `extends` if needed for Svelte type-checking.

### A7 — Create `src/styles/cards.css` (extract card art from styles.css)

Extract **only** the card visual rules (`.card`, `.card-joker`, `.card-red`, `.selected`, rank/suit sizing, animation classes, meld-group styling). Move these to the new file so they can be imported once in `app.client.ts`. Keep all *layout* rules (scoreboard layout, grid, flex positioning, activity-log panel) until Phase C. This file will grow to ~120-150 lines as you move card/meld visuals over.

### A8 — Create `src/app.client.ts` (Svelte entrypoint)

```ts
import { mount } from 'svelte';
import App from './components/layout/AppLayout.svelte';
import './styles/cards.css'; // card art only; Tailwind utilities are injected by Vite
import * as runtime from 'svelte/runtime'; // for Svelte 5 store interop

const app = mount(App, { target: document.getElementById('app')! });
export default app;
```

### A9 — Create `src/components/layout/AppLayout.svelte`

Svelte root component that assembles the game board. It replaces the HTML structure from `index.html`. Bind to a `writable<Game>` store for game state.

Template (conceptual):
```svelte
<svelte:head>
  <title>Telefunken — Peru v1</title>
</svelte:head>

<div id="app">
  <RoundIndicator />
  <ScoreboardTable {game} />
  <MeldsContainer {game} />
  <HumanHandPanel {game} />
  <ActivityLogPanel {game} />
  <ToastContainer />
  <GameOverOverlay {game} />
  <NewGameOverlay on:newGame={handleNewGame} />
  <DiscardBuyOverlay {game} />
</div>

<script lang="ts">
import { writable } from 'svelte/store';
import type { Game } from '../game/index.js';
import type { ActionLogEntry } from '../game/activity-log/entry.js';
import RoundIndicator from './RoundIndicator.svelte';
import ScoreboardTable from './Scoreboard.svelte';
import MeldsContainer from './MeldsContainer.svelte';
import HumanHandPanel from './HumanHandPanel.svelte';
import ActivityLogPanel from './ActivityLog.svelte';
import ToastContainer from '../toast/ToastContainer.svelte';
import GameOverOverlay from '../overlays/GameOverOverlay.svelte';
import NewGameOverlay from '../overlays/NewGameOverlay.svelte';
import DiscardBuyOverlay from '../overlays/DiscardBuyOverlay.svelte';

export let game: Game; // passed in from outside by the bootstrap code
const selectedCards = writable(new Set<string>());
</script>
```

### A10 — Create `Card/card.svelte` (first Svelte component, replaces ui.ts:113–145)

Props:
- `cardId: string`
- `allCards: Record<string, Card>`
- `selectable?: boolean = false`

Uses `$state({ selected })` for selectable toggle. Renders joker vs standard card with rankLabel + suitSymbol (unicode via the constants from ui.ts lines 10–32 moved into a shared constant file or directly in this component — I'd put them here as file-level `const`).

```svelte
<svelte:component />
<div class="card {...classes}" on:click={handleCardClick}>
  {#if card.isJoker} JOKER {:else}{rankLabel + suitSymbol} {/if}
</div>
<script lang="ts">
import type { Card } from '../game/card.js';
let { cardId, allCards, selectable = false }: { cardId: string; allCards: Record<string, Card>; selectable?: boolean } = $props();
const selected = $state(false);

function handleCardClick() {
  if (!selectable) return;
  selected.update((s) => !s);
}
</script>
```

### A11 — Wire up Svelte app to existing Game bootstrap (modify `index.html` and add `bootstrap.svelte.ts`)

**index.html:** Remove `<script type="module" src="./src/ui.ts">`. Add `<div id="app"></div>` if not already there. Import `bootstrap.svelte.ts` as module instead.

**Create `src/bootstrap.svelte.ts`:** Replace the current `ui.ts` bootstrap logic (lines 780–784 + the Game instantiation at lines 721–761) — it instantiates a new Game, calls `initUI()`, passes it to the Svelte root via context.

```ts
import Game from './game/index.js';
import { setGame } from './app.state.svelte.js';
import { mount } from 'svelte';
import App from './components/layout/AppLayout.svelte';
import './styles/cards.css';

const defaultName = 'Player 1';
const game = new Game(defaultName);
setGame(game);
mount(App, { target: document.getElementById('app')! });
```

The NewGameOverlay component will eventually trigger a new `Game()` instantiation and call `setGame(newGame)`.

**Gates:** `[ ] test [ ] typecheck [ ] lint [ ] build`
**Adversarial:** `[ ] APPROVED BY`

---

## Phase B — Overlays + Activity Log + Toasts

<!-- Status: PENDING -->
<!-- Start: -->
**Gates:** `[ ] test [ ] typecheck [ ] lint [ ] build`
**Adversarial:** `[ ] APPROVED BY`

### B1 — Create `src/components/Overlays/NewGameOverlay.svelte`

Replaces `showNewGameOverlay()` (ui.ts:442–452) and the New Game section of index.html. Props: `game`, `on:newGame` events for the Start button handler, the seed/name input logic.

Template includes the 6-deal contracts table, scoring reference table, name/seed inputs, and Start button. Uses Svelte `bind:value={name}` + event forwarding on click → `emit('newGame', { name, seed })`.

### B2 — Create `src/components/overlays/GameOverOverlay.svelte`

Replaces `renderGameOver()`, `hideGameOver()` (ui.ts:364–439). Props: `game`. Fetches leaderboard via `game.getLeaderboard()` and renders final standings table with rank, name, penalty score, chip bonus, total. Conditionally shows `"WINNER"` badge on rank-1 entry.

### B3 — Create `src/components/overlays/DiscardBuyOverlay.svelte`

Replaces `showDiscardBuyOverlay()`, `hideDiscardBuyOverlay()` (ui.ts:635–674). Props: `game`. Uses the `$state({ visible })` pattern with Svelte action for enter animations. Displays the top discard card via a nested `<Card />` component. Two buttons (yes / no) forward to events → parent handles via game engine callback.

### B4 — Create `src/components/toast/ToastContainer.svelte`

Replaces `showToast()` (ui.ts:35–49). Uses a Svelte store (`writable<{id, msg, duration}[]>`) for toast queue. Each toast auto-dismisses via `$state({ timer })`. Container mounts as a fixed-position div at top-left of viewport.

Create `src/lib/toast-store.svelte.ts`:
```ts
import { writable } from 'svelte/store';
export const toasts = writable<{ id: number; msg: string; duration: number }[]>([]);
let _counter = 0;
export function showToast(msg: string, duration = 2400) {
  toasts.update((t) => [...t, { id: ++_counter, msg, duration }]);
}
```

### B5 — Create `src/components/activity-log/ActivityLogPanel.svelte`

Replaces `actionLogEntries[]`, `renderActivityLog()` (ui.ts:54–109). Props: `game`. Uses the store pattern to sync with `game.activityLog.entries`. Contains `<ActionCard />` children. Collapsible panel via `$state({ collapsed })` toggle. Scroller auto-scrolls on new entries.

### B6 — Create `src/components/activity-log/ActionCard.svelte`

Each row shows player name, round number, action detail. Color-class derived from `ActionLogEntry.action` text mapped to ActivityLog.getActionCardClass() helper logic moved from ui.ts:57–67 into a utility or directly into this component. Props: `entry: ActionLogEntry`.

### B7 — Create shared constants file `src/lib/constants.svelte.ts` (or `constants.ts`)

Move suit symbols and rank labels out of ui.ts closure scope (lines 10–32) into a module-level exported constant, importable by all Svelte components. These are pure data: never reactive.

```ts
export const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
export const SUIT_SYMBOLS: Record<Suit, string> = { hearts: '\u2665', diamonds: '\u2666', ... };
export const RANK_LABELS: Partial<Record<CardRank, string>> = { '2': '2', ..., 14: 'A' };
```

### B8 — Create `src/app.state.svelte.ts` (app-wide writable store)

Provides the canonical game state for all components to subscribe to.

```ts
import { writable } from 'svelte/store';
import type { Game } from './game/index.js';
export const appStore = writable({
  game: null as Game | null,
  currentPhase: 'init' as GameState,
  selectedCards: new Set<string>(),
  sortMode: null as null | 'suit' | 'rank',
});
```

### B9 — Update `src/app.client.ts` / bootstrap to wire AppLayout with the store

Pass the game from `bootstrap.svelte.ts` into the App component, and connect the store. Verify that all existing event handlers (confirm new game, buy, end turn, set/run reveal, add-to-meld toggle, discard-buy yes/no) fire correctly through Svelte's declarative rendering and event forwarding pattern. The key change: event handlers no longer `document.getElementById('btn-...')` — they use inline `on:click={handler}` directives bound to Svelte props or store methods.

### B10 — Run gates + adversarial review

**Gates:** `[ ] test [ ] typecheck [ ] lint [ ] build`
**Adversarial:** `[ ] APPROVED BY`

---

## Phase C — Game Board Components + Full Shell Replacement

<!-- Status: IN_PROGRESS -->
<!-- Start: 2026-07-31 -->
<!-- Gates COMPLETE (C18): test ✓ typecheck ✓ lint ✓ build ✓ -->
<!-- Adversarial: [ ] APPROVED BY -->
**Gates:** `[x] test [x] typecheck [x] lint [x] build`
**Adversarial:** `[ ] APPROVED BY`

### C1 — Create `src/lib/components/scoreboard/RoundIndicator.svelte`

Replaces the `<section>` deal/contract display from `ui.ts:148–158`. Props: `{ game }: { game: Game }`. Display: `"Deal #N | Contract: count×minSize"`. Reuses existing CONTRACTS import already used in AppLayout. Uses Tailwind utility classes for layout, card art stays in `cards.css`.

```svelte
<script lang="ts">
	import type { Game } from '../../../game/engine/game-core.js';
	import { CONTRACTS } from '../../../game/contracts.js';
	let { game }: { game: Game } = $props();
</script>

<section class="bg-[#2c2c2c] px-6 py-3 rounded-lg text-center text-xl tracking-wide select-none w-full max-w-screen-md">
	<span class="text-[#f5d442]">{game.dealNumber}</span> &middot; Contract:
	<span class="font-mono">
		{CONTRACTS[game.dealNumber - 1]?.count ?? '\u2014'}\u00d7{CONTRACTS[game.dealNumber - 1]?.minSize ?? '\u2014'}
	</span>
</section>
```

### C2 — Create `src/lib/components/scoreboard/ScoreboardTable.svelte`

Replaces the `#scoreboard-body` rendering (ui.ts:160–193). Props: `{ game }. Renders player name, card count (human only), buys/chips, score, status. Each row is a `<ScoreboardRow>` child. Shows dealer `[D]`, active-player arrow `►`.

### C3 — Create `src/lib/components/scoreboard/ScoreboardRow.svelte` (child of ScoreboardTable)

Individual row with:
- Name cell: shows `"► [D] {name}"` if active & dealer, `"► {name}"` if active, `"[D] {name}"` if dealer, otherwise just name
- Card count: `p.hand.length` for human (Player 0), `"?"` for AI (Players 1–3)
- Chips: `p.chips` value
- Score: `p.score` value
- Status: `"OUT"` when `hand.length === 0 && game.state === 'dealover'`, otherwise empty

Uses Tailwind `border-b border-slate-700 hover:bg-slate-800/50 ring-2 ring-blue-400` for active player highlighting. Color-highlighting for active player row background (e.g., `bg-blue-900/30`).

### C4 — Create `src/lib/components/gameboard/MeldsContainer.svelte`

Replaces `#melds-container` rendering and table meld display (ui.ts:195–215). Props: `{ game }. Contains:
- Nested `<MeldGroup>` components for each `game.tableMelds` entry
- Stock pile area showing `"Stock: {game.deck?.remaining}"`
- Discard pile area showing top card via `<Card />` or `"—"

### C5 — Create `src/lib/components/gameboard/MeldGroup.svelte` (child of MeldsContainer)

Props: `{ meld, game }. Header line shows `"Owner's type (contract)"` for contract melds. Cards rendered as `<Card />` children in a flex-wrap grid. Uses `.meld-group / .meld-owner-label` styling from `cards.css`.

### C6 — Create `src/lib/components/gameboard/HumanHandPanel.svelte`

Replaces `#human-hand`, sort buttons (ui.ts:247–282). Props: `{ game }. Contains:
- Sort controls row with suit/rank toggle buttons
- Hand display with mapped card objects sorted per `appStore.sortMode` (or unsorted)
- Each card rendered as `<Card selectable={true} on:select />`
- Selection synced to `appStore.selectedCards`

Sorting logic: when sort mode changes, clear existing selection in hand, apply `sortByRank()` or `sortBySuit()` from game/utils.ts, re-render. Unsort clears the active-sort class.

### C7 — Create `src/lib/components/controls/MeldControls.svelte`

Replaces `#meld-controls`. Props: `{ phase, onConfirmSet, onConfirmRun }`. Two buttons: "Confirm Set" / "Confirm Run". Disabled when not in 'meld' phase or not human's turn. Uses Tailwind `disabled:opacity-40 disabled:cursor-not-allowed` instead of imperative pointer-events.

### C8 — Create `src/lib/components/controls/AddMeldControls.svelte`

Replaces `#add-meld-controls` (ui.ts:218–227 + ui.ts:516–539). Props: `{ visible, tableMelds, onConfirm }`. Dropdown `<select>` populated from `game.tableMelds`. "Add Selected" button. Uses Svelte `{#if visible}` for visibility control (no more manual display toggle).

### C9 — Create `src/lib/components/controls/TurnControls.svelte`

Replaces the Enable/Disable button logic (ui.ts:293–362, btn-buy, btn-end-turn). Props: `{ game, onBuy, onEndTurn }`. Conditionally disables buy/end buttons using Tailwind `disabled` + `opacity` classes. Shows "Draw Card" button when phase === 'draw'.

### C10 — Create stock/discard visuals via MeldsContainer (C4 already covers this)

No separate files needed — StockPile and DiscardPile are inline sections inside `<MeldsContainer />` using the shared `<Card />` component (with selectable=false).

### C11 — Wire `updateControls()` logic into Svelte

Replace the imperative enable/disable of buttons (`ui.ts:293–362`) with derived Svelte `$state({ isHumanTurn, canBuy, showMeldControls })` signals derived from `game.state`. Each button's `disabled` attribute maps directly to the computed boolean. The `opacity` CSS classes replace imperative inline styles — Tailwind handles disabled styling.

### C12 — Wire deal-over / gameover state transitions into Svelte event handlers

Replace the `onStateChanged()` callback block (`ui.ts:676–709`) with Svelte `$effect` that reacts to `appStore.game.state`:
- `'dealover'` → `setTimeout(() => game.advanceDeal(), 1500)`
- `'gameover'` → dispatch event to `GameOverOverlay` component (which manages its own visibility via the `visible={phase === 'gameover'}` prop pattern already in AppLayout)
- `'buyDiscard'` → handled by conditional rendering of `<DiscardBuyOverlay>`

### C13 — Wire AI auto-play timer into Svelte

Move `setTimeout(game.aiPlayTurn)` logic from `ui.ts:701–709` into a Svelte `$effect` that watches `appStore.game.currentPlayerIndex` and `game.state`. If current player is AI + state is `'draw'` or `'meld'`, schedule AI turn after 800ms delay. Use cleanup function in `$effect` to cancel stale timers on dependency change.

### C14 — Wire New Game flow in bootstrap + overlay interaction

Already partially done in AppLayout.svelte (`handleNewGame`). Needs minor refinement:
- On `onStart` from NewGameOverlay, capture `{name, seed}`, call `game.reset(name)`, then `setTimeout(game.startDeal, 300)` to match original timing
- The store update triggers Svelte re-render with new game state
- ActivityLogEntry push logic stays in bootstrap: it uses `game.activityLog.push()`.

### C15 — Update `index.html` shell (already minimal from Phase B)

No changes needed — `index.html` is already minimal:
```html
<div id="app"></div>
<script type="module" src="./src/bootstrap.svelte.ts"></script>
```

### C16 — Delete `styles.css` (if it still exists) — no longer needed

The existing card art is in `src/styles/cards.css` (~69 lines). Layout/typography are Tailwind utilities. Remove the old `styles.css` if present.

### C17 — Delete `ui.ts` (784 lines) — fully replaced by Svelte components

Once every section of ui.ts has an equivalent Svelte component or store mechanism, delete the file. Verify the app still renders and all 4 gates pass. **Do this only after all C1–C16 are complete and gates green.**

### C18 — Full gate run + adversarial review on entire migrated codebase

**Gates:** `[ ] test [ ] typecheck [ ] lint [ ] build`
**Adversarial:** `[ ] APPROVED BY`

### C1 — Create `src/components/layout/RoundIndicator.svelte`

Replaces the `#round-indicator` section from index.html and the deal/contract label text rendering (ui.ts:148–158). Props: `game`. Displays `"Deal #N | Contract: count×minSize"`.

### C2 — Create `src/components/scoreboard/ScoreboardTable.svelte`

Replaces the scoreboard section from index.html and `#scoreboard-body` rendering (ui.ts:160–193). Props: `game`. Renders player name, card count (human only = `?` for AI), buys, score, status (`OUT` when hand empty + phase == dealover). Shows dealer/marker markers `[D]`, active-player arrow →.

Each row is a `<ScoreboardRow>` child for cleaner structure.

### C3 — Create `src/components/scoreboard/ScoreboardRow.svelte` (child)

Individual row with color-highlighting for active player and dealer marker props. Card counts shown as number for human, `?` for AI. Status cell shows `'OUT'` when hand is empty + gameState === 'dealover'.

### C4 — Create `src/components/gameboard/MeldsContainer.svelte`

Replaces `#melds-container` rendering and table meld display (ui.ts:195–215). Also renders the piles area (stock count + top discard card). Props: `game`. Contains nested `<MeldGroup>`, `<StockPile>`, `<DiscardPile>` components.

### C5 — Create `src/components/gameboard/MeldGroup.svelte`

Individual on-table meld with owner label and cards grid. Props: `meld: Meld, game: Game`. Shows `"Owner's type (contract)"` header, then renders cards via `<Card />` children. The `isContract` flag renders the crosswise indicator for Deal 1 pure trio.

### C6 — Create `src/components/gameboard/HumanHandPanel.svelte`

Replaces `#human-hand`, sort buttons logic (ui.ts:247–282 + lines 577–633 in ui.ts). Props: `{ game }`. Contains: Sort controls row (`<SortControls />`), the hand display with `<Card selectable={true} />, and selection state synced with `appStore.selectedCards`. On card click, toggles the card's `$state({ selected })` and updates the shared store. On sort button press, fires event → parent calls `game.sortHand()` or updates appStore directly via setter.

### C7 — Create `src/components/controls/MeldControls.svelte`

Replaces `#meld-controls` from index.html. Set/Run radio selector + Confirm Set / Confirm Run buttons. Uses `<input type="radio" name="meldType">`. On confirm, reads the selected cards via a prop getter or event dispatch → parent calls `game.playMeld()`.

### C8 — Create `src/components/controls/AddMeldControls.svelte`

Replaces `#add-meld-controls` (ui.ts:516–539). Contains dropdown `<select>` for target meld + Add Selected button. The dropdown options populated from `game.tableMelds`. Visibility toggled by a parent prop or the `btn-add-meld-toggle` event → `$state({ visible })` on this component.

### C9 — Create `src/components/controls/TurnControls.svelte`

Replaces the Enable/Disable button logic (ui.ts:293–362 + buttons from index.html). Props: `{ game, human }`. Conditionally disables/enables buy and end-turn buttons based on gameState and isHumanTurn conditions. The enable/disable state maps to `opacity` CSS classes instead of inline `pointerEvents`.

### C10 — Create `src/components/gameboard/StockPile.svelte` + `DiscardPile.svelte` (children)

`StockPile`: displays `"Stock: N"` with remaining card count from `game.deck.remaining`.
`DiscardPile`: shows top discard card as a `<Card />` component or `—` if empty.

### C11 — Wire `updateControls()` logic into Svelte

Replace the imperative enable/disable of buttons (ui.ts:293–362) with Svelte's reactive `$state({ isHumanTurn, canBuy })` derived from `game.state`. Each button's `class:disabled={...}` conditional renders. No more manual DOM class manipulation!

### C12 — Wire deal-over / gameover state transitions into Svelte event handlers for onStateChange

Replace the `onStateChanged()` callback block (ui.ts:700–718) with a Svelte `$effect` that reacts to `appStore.game.currentPhase`. Handle:
- `dealover` → `setTimeout(() => game.advanceDeal(), 1500)` 
- `gameover` → `renderGameOver()` via event dispatch to overlay component (which manages its own visibility)
- `buyDiscard` → show DiscardBuyOverlay

### C13 — Wire the AI auto-play timer (ui.ts:701–709) into Svelte

Move `setTimeout(game.aiPlayTurn)` logic from ui.ts lines 701–709 into a Svelte `$effect` that watches `appStore.game.currentPlayerIndex` and `game.state`. If the current player is AI + state is 'draw' or 'meld', schedule the AI turn after 800ms delay.

### C14 — Wire New Game flow in bootstrap + overlay interaction

- On NewGameOverlay `on:newGame`, capture { name, seed }, create fresh `new Game(name, seed)`, call `setGame(newGame)`.
- The Store update triggers a Svelte `$effect` that re-renders the entire app tree with new game state.
- Keep ActivityLogEntry push logic (`pushActionLogEntry()`) in bootstrap: it should still append to `game.activityLog` via the game engine method (which we never modify).

### C15 — Update `index.html` shell to be minimal ✅ DONE

`index.html` is already minimal (12 lines):
```html
<div id="app"></div>
<script type="module" src="./src/bootstrap.svelte.ts"></script>
```
No changes needed — Phase B bootstrap wire-up already stripped all game-specific sections.

### C16 — Delete `styles.css` (571 lines) ✅ DONE

Deleted `styles.css` — card art moved to `src/styles/cards.css`, all layout/typography now Tailwind utilities in components.

### C17 — Delete `ui.ts` (784 lines) ✅ DONE

Deleted `src/ui.ts` — fully replaced by 14 Svelte component files in `src/lib/components/`. All gates confirmed green post-deletion.

### C18 — Full gate run + adversarial review on entire migrated codebase 🟡 GATES PASS, ADVERSARIAL PENDING

Gates (ALL GREEN):
- ✅ `pnpm test`: 195/195 passed
- ✅ `pnpm typecheck`: 0 errors
- ✅ `pnpm lint`: 0 warnings, 0 errors
- ✅ `pnpm build`: ✓ built in 381ms (0 warnings)

**Adversarial:** `[ ] APPROVED BY`

---

## Phase D — PWA (Service Worker + Manifest Only)

<!-- Status: PENDING -->
<!-- Start: -->
**Gates:** `[ ] test [ ] typecheck [ ] lint [ ] build`
**Adversarial:** `[ ] APPROVED BY`

### D1 — Create `public/manifest.webmanifest`

```json
{
  "name": "Telefunken — Peru v1",
  "short_name": "Telefunken",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1b2a40",
  "theme_color": "#1b2a40",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### D2 — Create icon assets in `public/icons/`

Generate two PNGs (192×192 and 512×512) of the card suit back or a simple Telefunken card-icon. These are game branding, not game logic — use the same design style as existing card art (unicode suits). Can use any SVG→PNG tool or generate from CSS in development.

### D3 — Update `index.html` with manifest link + theme meta tags

```html
<meta name="theme-color" content="#1b2a40">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
```

### D4 — Create `src/pwa/service-worker.ts`

Register a service worker that:
1. **Precaches** the app shell (HTML + all JS bundles) via Workbox-style strategy or a simple `self.__WB_MANIFEST` injection if available through Vite's build process.
2. **Cache-first** for game assets (fonts, images, card back textures — if any).
3. **Network-first with fallback to cache** for the HTML shell, so the app works fully offline after first visit.
4. Handles `activate` event with client claim + skipWaiting for instant updates.

```ts
// src/pwa/service-worker.ts
import { createHandlerBoundToURL } from './precache-manifest.mjs'; // if using Workbox
const precacheManifest = self.__WB_MANIFEST; // injected at build time
const core = new RegExp('^[^/]*$'); // match the app shell files

// ... install, activate, fetch handlers per PWABuilder patterns
```

Register in `src/pwa/register-sw.svelte.ts`:
```ts
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { type: 'module' });
}
```

Call from `bootstrap.svelte.ts` or a dedicated mount hook.

### D5 — Create PWA entry file `sw.mjs` (the actual service worker module that gets built to `/sw.js`)

This is the service worker file itself. Vite build should copy it to `/sw.js` in dist/. The `vite.config.ts` needs a plugin or manual copy step for this:
```ts
// vite config — add copy of sw to root
plugins: [tailwindcss(), svelte(), copy({ targets: [{ src: 'src/pwa/sw.mjs', dest: '' }] }), ]
```

Or create `sw.js` directly at the repo root and reference it in manifest. The service worker should use `'/'` scope.

### D6 — Create optional install prompt component `src/components/pwa/InstallPrompt.svelte`

A `<button>+toast` that appears when `beforeinstallprompt` fires on the window. Shows "Add to Home Screen" call-to-action at the bottom of the screen (position fixed). Dismissable via close button or click. Conditionally renders only when `deferPromptEvent !== null`.

```svelte
{#if deferredPrompt}
  <button on:click={handleInstall}>Add to Home Screen</button>
{/if}
```

### D7 — Add PWA meta + service worker hooks into index.html + Vite build output

Ensure the final `dist/` contains:
- `manifest.webmanifest` (copied)
- `/icons/icon-192.png` and `/icons/icon-512.png`
- `/sw.js` (service worker file)

Verify with: `pnpm build && ls dist/manifest.* dist/sw.* dist/icons/`

### D8 — Test PWA installability in Chrome DevTools Lighthouse / Application tab

- Open built app in Chrome
- Application → Manifest → verify all required fields present
- Service Worker tab → verify registered, activated with no errors
- Network tab throttled to offline → app shell loads from cache
- Install banner fires (or deferred prompt component shows)

### D9 — Full gate run + adversarial review on entire codebase including PWA

**Gates:** `[ ] test [ ] typecheck [ ] lint [ ] build`
**Adversarial:** `[ ] APPROVED BY`

---

## Cross-Phase Notes

### Tailwind utility classes to use throughout components

| Context | Tailwind class(es) | Purpose |
|---------|-------------------|---------|
| Card grid | `flex flex-wrap gap-1.5` | Hand, melds container |
| Overlay panel | `fixed inset-0 bg-black/60 items-center justify-center flex` | Centered overlay backdrop |
| Modal box | `bg-slate-900 rounded-lg p-4 max-w-sm w-full shadow-xl` | Overlay content card |
| Buttons | `px-3 py-1.5 text-sm font-medium rounded cursor-pointer ...` | Interactive elements |
| Disabled buttons | `opacity-40 pointer-events-none` | replace imperative setStyle |
| Scroll panel | `overflow-y-auto max-h-[40vh]` | Activity log |
| Table rows | `border-b border-slate-700` + `hover:bg-slate-800/50` | Scoreboard, leaderboard |
| Active player highlight | `ring-2 ring-blue-400` | Scoreboard row |
| Toast | `fixed top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded shadow-lg` | Notification toasts |
| Contract indicator | `font-mono text-xl` | Deal 1 "pure trio" crosswise |

### Events that need forwarding between components

| Event | Origin Component | Target | Data |
|-------|-----------------|--------|------|
| `newGame` | NewGameOverlay | bootstrap/handler | `{ name: string, seed: number }` |
| `cardSelect` | Card.svelte (human hand) | HumanHandPanel → appStore | `{ cardId: string, selected: boolean }` |
| `meldConfirm` | MeldControls | parent handler → `game.playMeld()` | `{ ids: string[], type: 'set' \| 'run' }` |
| `addToMeldSelect` | AddMeldControls | parent handler → `game.addToExistingMeld()` | `{ targetMeldIdx: number, ids: string[] }` |
| `buyCard` | TurnControls/btn-buy | parent handler → `game.buyDiscard()` | |
| `endTurn` | TurnControls/btn-end-turn | parent handler → `game.endTurn()` | |
| `install` | InstallPrompt.svelte | window.addEventListener | deferred prompt event |

### Files that will be deleted at the end of Phase C

| File | Lines | Replaced by |
|------|-------|-------------|
| `src/ui.ts` | 784 | All Svelte components + stores |
| `styles.css` | 571 | Tailwind utilities + small `src/styles/cards.css` (~120-150 lines) |
| index.html (game sections) | ~130 lines of HTML template | Component rendering via Svelte app tree |

### Files that will remain unchanged (game engine, untouched)

**Nothing changes here.** This is purely a UI/presentation refactor. All of `src/game/` stays exactly as-is:
- `Engine`, `Player`, `Meld`, `Card`, `Deck`, `Contract`, `validateset()`, `validatorRun()`
- AI logic (`evaluateMelds`, `aiDiscardSelection`)
- Scoreboard (`scoreDeal`, `endGame`, `getLeaderboard`)
- Activity log engine (`ActivityLog`, `ActionLogEntry`)

### Testing considerations during migration

1. **Unit tests (Vitest)** should continue to pass as-is since they test `src/game/` which doesn't change.
2. **Typecheck** may initially complain about Svelte component imports — use `svelte-check --html tsconfig` for full verification. Run `tsc && svelte-check` together as a gate.
3. **ESLint** needs a Svelte parser: `pnpm add -D eslint-plugin-svelte`. Add `.svelte` to ESLint's `overrides[].files` in `eslint.config.js`. Ensure all existing rules apply correctly to `.ts` files too.
4. **Vite build** may need the `ssr.noExternal` option if Svelte 5 requires server rendering — add to `vite.config.ts`:
   ```ts
   ssr: { noExternal: ['svelte'] }
   ```
