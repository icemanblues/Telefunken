<script lang="ts">
	import type { Game } from '../../../game/engine/game-core.js';
	import { CONTRACTS } from '../../../game/contracts.js';
	import { addToast, removeAllToasts } from '../../toast-store.svelte.js';
	import ActivityLogPanel from '../activity-log/ActivityLogPanel.svelte';
	import { appStore, selectedCards as storeSelectedCards } from '../../app-state.svelte.js';

	// Phase B overlays
	import NewGameOverlay from '../overlay/NewGameOverlay.svelte';
	import GameOverOverlay from '../overlay/GameOverOverlay.svelte';
	import DiscardBuyOverlay from '../overlay/DiscardBuyOverlay.svelte';

	let { game }: { game: Game } = $props();

	const selectedCardsList = $derived(Array.from($storeSelectedCards));
	const phase = $derived(game.state);
	const isHumanTurn = $derived(game.currentPlayerIndex === 0);
	const showMeldControls = $derived(isHumanTurn && (phase === 'meld'));
	const showDiscardOverlay = $derived((phase === 'buyDiscard') && isHumanTurn);

	function handleNewGame(data: { name: string; seed: string | number | null }) {
		const n = data.name.trim() || 'Player 1';
		game.playerName = n;
		game.newSeed = data.seed;
		game.reset(n);

		setTimeout(() => {
			game.startGame();
		}, 300);
		removeAllToasts();
		storeSelectedCards.set(new Set());
	}

	function handleBuyYes() {
		const idx = game.discardBuyerPromptIndex;
		if (idx >= 0) {
			game.buyDiscard(idx);
			addToast(`${game.players[idx].name} bought the discard.`);
		}
	}

	function handleBuyNo() {
		game.advanceBuyDiscardPrompt();
	}

	function handleEndTurn() {
		if (phase === 'meld') {
			game.endTurn(0);
		}
	}

	function getSelectedIds(): string[] {
		return Array.from($storeSelectedCards);
	}

	function handleConfirmSet() {
		const ids = getSelectedIds();
		if (ids.length > 0) {
			const ok = game.playMeld(0, ids, 'set');
			if (!ok) addToast('Invalid set — check eligibility.');
			else storeSelectedCards.set(new Set());
		}
	}

	function handleConfirmRun() {
		const ids = getSelectedIds();
		if (ids.length > 0) {
			const ok = game.playMeld(0, ids, 'run');
			if (!ok) addToast('Invalid run — check eligibility.');
			else storeSelectedCards.set(new Set());
		}
	}

	function handleConfirmAdd() {
		const ids = getSelectedIds();
		const selEl = document.getElementById('add-meld-target') as HTMLSelectElement | null;
		const meldIdx = selEl ? parseInt(selEl.value, 10) : NaN;
		if (!isNaN(meldIdx) && ids.length > 0) {
			game.addToExistingMeld(0, meldIdx, ids);
			storeSelectedCards.set(new Set());
		}
	}

	function handleToggleSort(mode: 'suit' | 'rank') {
		const current = $appStore.sortMode;
		if (current === mode) {
			appStore.update(s => ({ ...s, sortMode: null }));
		} else {
			storeSelectedCards.set(new Set());
			appStore.update(s => ({ ...s, sortMode: mode }));
		}
	}

	function handleDrawCard() {
		game.drawFromStock(0);
	}

	function onCardSelected(cardId: string, isSelected: boolean) {
		storeSelectedCards.update(s => {
			if (isSelected) s.add(cardId);
			else s.delete(cardId);
			return s;
		});
	}
</script>

<svelte:head>
	<title>Telefunken — Peru v1</title>
</svelte:head>

<div class="min-h-screen bg-[#1a3c2a] text-[#f0e6d3] flex flex-col gap-3 p-4 items-center">

	<h1 class="text-2xl font-bold text-[#f5d442] tracking-wide">Telefunken — Peru v1</h1>

	{#if game}

		<!-- Deal/Contract display -->
		<section class="bg-[#2c2c2c] px-6 py-3 rounded-lg text-center text-xl tracking-wide select-none w-full max-w-screen-md mb-4">
			<span class="text-[#f5d442]">{game.dealNumber}</span> &middot; Contract:
			<span class="font-mono">
				{CONTRACTS[game.dealNumber - 1]?.count ?? '\u2014'}\u00d7{CONTRACTS[game.dealNumber - 1]?.minSize ?? '\u2014'}
			</span>
		</section>

		<!-- Phase B Overlays -->
		{#if phase === 'init'}
			<NewGameOverlay
				playerName={game.playerName}
				defaultSeed={game.seed}
				onStart={handleNewGame}
			/>
		{/if}

		<GameOverOverlay game={game} visible={phase === 'gameover'} onRestart={() => handleNewGame({ name: game.playerName, seed: null })} />

		{#if showDiscardOverlay}
			<DiscardBuyOverlay
				game={game}
				visible={phase === 'buyDiscard'}
				onYes={handleBuyYes}
				onNo={handleBuyNo}
			/>
		{/if}

		<!-- Phase C stubs (placeholder sections) -->
		<div class="flex gap-4 w-full max-w-screen-lg flex-wrap justify-center">

			<!-- Left column: game board components (Phase C) -->
			<div class="flex-1 min-w-[300px] space-y-3">

				<section class="bg-[#2c2c2c] rounded-lg p-4 text-center opacity-50 text-sm">
					[Phase C: Scoreboard + Melds + Hand Panel]
				</section>

			</div>

			<!-- Right column -->
			<div class="w-full max-w-sm">
				<section class="bg-[#2c2c2c] rounded-lg p-4 text-center opacity-50 text-sm mb-3">
					[Phase C: Human Hand + Controls + Sort]
				</section>

				{#if showMeldControls}
					<div id="meld-controls" class="flex gap-2 mt-2 justify-center">
						<button onclick={handleConfirmSet}
							class="px-3 py-1.5 text-xs font-medium rounded bg-[#f5d442] text-black hover:bg-[#e5c432] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
							Confirm Set
						</button>
						<button onclick={handleConfirmRun}
							class="px-3 py-1.5 text-xs font-medium rounded bg-[#f5d442] text-black hover:bg-[#e5c432] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
							Confirm Run
						</button>
					</div>
				{/if}

				{#if isHumanTurn && phase !== 'gameover' && phase !== 'dealover'}
					<div class="mt-2 flex justify-center gap-2">
						<button onclick={handleDrawCard}
							class="px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
							disabled={phase !== 'draw'}>
							Draw Card
						</button>
						<button onclick={handleEndTurn}
							class="px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
							disabled={phase !== 'meld'}>
							End Turn
						</button>
					</div>
				{/if}

			</div>

			<!-- Activity Log (Phase B) -->
			<div class="w-full max-w-sm">
				<ActivityLogPanel { game } />
			</div>

		</div>

	{/if}

</div>

<style>
	section:hover { opacity: 0.8; }
	button[disabled] { pointer-events: none; }
</style>
