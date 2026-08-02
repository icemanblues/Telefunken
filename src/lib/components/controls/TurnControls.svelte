<script lang="ts">
	import type { Game } from '../../../game/engine/game-core.js';

	let { game, onBuy, onDraw, onEndTurn }: {
		game: Game;
		onBuy: () => void;
		onDraw: () => void;
		onEndTurn: () => void;
	} = $props();

	const human = $derived(game.players[0]);
	const isHumanTurn = $derived(game.currentPlayerIndex === 0);
	const phase = $derived(game.state);
	const canBuy = $derived(
		isHumanTurn && !human.hasMelded
		&& human.chips > 0 && game.discardPile.length > 0
		&& phase !== 'dealover' && phase !== 'gameover' && phase !== 'buyDiscard'
	);
	const stockRemaining = $derived(game.deck?.remaining ?? 0);
	const canDraw = $derived(isHumanTurn && phase === 'draw' && stockRemaining > 0);
</script>

<div class="mt-2 flex justify-center gap-2">
	<button type="button"
		class="px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
		onclick={onBuy}
		disabled={!canBuy}>
		Buy from Discard (1 chip)
	</button>
	<button type="button"
		class="px-3 py-1.5 text-xs font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
		onclick={onDraw}
		disabled={!canDraw}>
		Draw Card
	</button>
	<button type="button"
		class="px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
		onclick={onEndTurn}
		disabled={phase !== 'meld'}>
		End Turn
	</button>
</div>

