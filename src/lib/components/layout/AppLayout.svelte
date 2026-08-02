<script lang="ts">
	import type { Game } from '../../../game/engine/game-core.js';
	import RoundIndicator from '../scoreboard/RoundIndicator.svelte';
	import ScoreboardTable from '../scoreboard/ScoreboardTable.svelte';
	import MeldsContainer from '../gameboard/MeldsContainer.svelte';
	import HumanHandPanel from '../gameboard/HumanHandPanel.svelte';
	import TurnControls from '../controls/TurnControls.svelte';
	import ActivityLogPanel from '../activity-log/ActivityLogPanel.svelte';

	// Phase B overlays
	import NewGameOverlay from '../overlay/NewGameOverlay.svelte';
	import GameOverOverlay from '../overlay/GameOverOverlay.svelte';
	import DiscardBuyOverlay from '../overlay/DiscardBuyOverlay.svelte';

	import { addToast } from '../../toast-store.svelte.js';
	import { selectedCards, appStore, updatePhase } from '../../app-state.svelte.js';
	import { get } from 'svelte/store';

	let { game }: { game: Game } = $props();

	const phase = $derived(game.state);
	const isHumanTurn = $derived(game.currentPlayerIndex === 0);
	const showMeldControls = $derived(isHumanTurn && (phase === 'meld'));
	const showDiscardOverlay = $derived(phase === 'buyDiscard' && isHumanTurn);
	const stockRemaining = $derived(game.deck?.remaining ?? 0);
	const human = $derived(game.players[0]);

	let _aiTimer: number | undefined = undefined;
	let _dealoverTimer: number | undefined = undefined;

	// C12-C13: AI auto-play timer + deal-over transition via $effect
	$effect(() => {
		const s = game.state;
		const cpIdx = game.currentPlayerIndex;
		const isAI = !game.players[cpIdx]?.isHuman;

		if (s === 'dealover') {
			clearTimeout(_dealoverTimer);
			_dealoverTimer = setTimeout(() => {
				if (game.state !== 'dealover') return;
				game.advanceDeal();
			}, 1500);
		} else if (isAI && (s === 'draw' || s === 'meld')) {
			clearTimeout(_aiTimer);
			_aiTimer = setTimeout(() => {
				if (!game.isCurrentPlayerAI()) return;
				if (game.state !== 'draw' && game.state !== 'meld') return;
				game.aiPlayTurn(game.currentPlayerIndex);
				game.publish('stateChanged');
			}, 800);
		}

		return () => {
			clearTimeout(_dealoverTimer);
			clearTimeout(_aiTimer);
		};
	});

	function handleNewGame(data: { name: string; seed: string | number | null }) {
		clearTimeout(_dealoverTimer);
		clearTimeout(_aiTimer);
		_dealoverTimer = undefined;
		_aiTimer = undefined;
		const n = data.name.trim() || 'Player 1';
		game.playerName = n;
		game.newSeed = data.seed;
		game.reset(n);
		setTimeout(() => { game.startGame(); }, 300);
		selectedCards.set(new globalThis.Set());
	}

	function handleBuyYes() {
		const idx = game.discardBuyerPromptIndex;
		if (idx >= 0 && game.state === 'buyDiscard') {
			const ok = game.buyDiscard(idx);
			addToast(ok ? `${game.players[idx].name} bought the discard.` : `Could not — invalid state.`);
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

	function handleDrawCard() {
		if (stockRemaining > 0) {
			game.drawFromStock(0);
		} else {
			addToast('Stock is empty.');
		}
	}

	function handleBuyDiscard() {
		if (game.discardPile.length > 0 && human?.chips! > 0) {
			game.buyDiscard(0);
		} else {
			addToast('Cannot buy from discard.');
		}
	}

	function handlePlayMeld(type: 'set' | 'run') {
		const ids = Array.from(get(selectedCards));
		if (ids.length > 0) {
			const ok = game.playMeld(0, ids, type);
			if (!ok) addToast(`Invalid ${type} — check eligibility.`);
			else selectedCards.set(new Set());
		}
	}

	function handleConfirmAdd() {
		const ids = Array.from(get(selectedCards));
		const selEl = document.getElementById('add-meld-target') as HTMLSelectElement | null;
		const meldIdx = selEl ? parseInt(selEl.value, 10) : NaN;
		if (!isNaN(meldIdx) && ids.length > 0) {
			game.addToExistingMeld(0, meldIdx, ids);
			selectedCards.set(new Set());
		}
	}

	function onCardSelect(cardId: string, isSelected: boolean) {
		selectedCards.update(s => {
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
		<RoundIndicator {game} />
		<ScoreboardTable {game} />
		<MeldsContainer {game} />

		<div class="flex gap-4 w-full max-w-screen-lg flex-wrap justify-center">

			<!-- Left: hand + controls -->
			<div class="flex-1 min-w-[300px] space-y-3">
				<HumanHandPanel {game} onCardSelect={onCardSelect} />
				<TurnControls {game} onBuy={handleBuyDiscard} onDraw={handleDrawCard} onEndTurn={handleEndTurn} />

				<!-- Meld controls -->
				{#if showMeldControls}
					<div class="flex gap-2 mt-1 justify-center">
						<button type="button"
							class="px-3 py-1.5 text-xs font-medium rounded bg-[#f5d442] text-black hover:bg-[#e5c432] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
							onclick={() => handlePlayMeld('set')}>
							Confirm Set
						</button>
						<button type="button"
							class="px-3 py-1.5 text-xs font-medium rounded bg-[#f5d442] text-black hover:bg-[#e5c432] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
							onclick={() => handlePlayMeld('run')}>
							Confirm Run
						</button>
					</div>
				{/if}

				<!-- Add-to-existing-meld controls -->
				{#if human?.hasMelded && game.tableMelds.length > 0}
					<div class="flex gap-2 mt-1 justify-center items-center">
						<select id="add-meld-target"
							class="px-2 py-1 text-xs rounded bg-[#2c2c2c] border border-slate-600 text-white">
							<option value="" disabled selected>Select meld to add...</option>
							{#each game.tableMelds as meld}
								<option value={meld.owner}>
									{game.players[meld.owner].name}'s {meld.type} ({meld.cards.length} cards)
								</option>
							{/each}
						</select>
						<button type="button"
							class="px-3 py-1.5 text-xs font-medium rounded bg-[#f5d442] text-black hover:bg-[#e5c432] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
							onclick={handleConfirmAdd}
							disabled={!human.hasMelded || !isHumanTurn}>
							Add Selected
						</button>
					</div>
				{/if}
			</div>

			<!-- Right: Activity Log -->
			<div class="w-full max-w-sm">
				<ActivityLogPanel {game} />
			</div>

		</div>

		<!-- Phase B overlays -->
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
				visible={phase === 'buyDiscard' && isHumanTurn}
				onYes={handleBuyYes}
				onNo={handleBuyNo}
			/>
		{/if}

	{/if}

</div>

