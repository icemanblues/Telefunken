<script lang="ts">
	import type { Game } from '../../../game/engine/game-core.js';
	import MeldGroup from './MeldGroup.svelte';
	import Card from '../../../components/card/Card.svelte';

	let { game }: { game: Game } = $props();

	const topCardId = $derived(
		game.discardPile.length > 0
			? game.discardPile[game.discardPile.length - 1]
			: null
	);
</script>

<div class="flex flex-wrap gap-4 items-start w-full max-w-screen-lg justify-center mb-2">
	<!-- Meld groups area -->
	<div class="flex flex-wrap gap-3">
		{#each game.tableMelds as meld, i (meld.owner + '-' + meld.cards[0]?.id + '-' + game.dealNumber)}
			<MeldGroup {meld} {game} />
		{/each}
	</div>

	<!-- Piles area -->
	<div class="ml-auto p-4 bg-[#1f3a28] rounded-lg border border-[#4a7a5c] flex gap-6 items-center">
		<div class="text-center">
			<div class="text-xs text-slate-400 mb-1">Stock</div>
			<div class="text-xl font-bold text-[#f5d442]">{game.deck?.remaining ?? 0}</div>
			<div class="text-xs text-slate-300 mt-1">cards</div>
		</div>
		<div class="text-center">
			<div class="text-xs text-slate-400 mb-1">Discard pile</div>
			{#if topCardId}
				<Card cardId={topCardId} allCards={game.allCards} />
			{:else}
				<div class="text-xl text-slate-500">\u2014</div>
			{/if}
			<div class="text-xs text-slate-300 mt-1">cards</div>
		</div>
	</div>
</div>

