<script lang="ts">
	import type { Game } from '../../../game/engine/game-core.js';
	import Card from '../../../components/card/Card.svelte';
	import { sortByRank, sortBySuit } from '../../../game/utils.js';
	import { appStore, selectedCards } from '../../app-state.svelte.js';
	import { SvelteSet } from 'svelte/reactivity';

	let {
		game,
		onCardSelect = () => {},
	}: {
		game: Game;
		onCardSelect?: (cardId: string, isSelected: boolean) => void;
	} = $props();

	const human = $derived(game.players[0]);

	function getSortMode(): null | 'rank' | 'suit' {
		return appStore.getState().sortMode;
	}

	const sortedHand = $derived.by(() => {
		const all = game.getAllCards();
		const mode = getSortMode();
		if (mode === 'suit') return sortBySuit(human.hand.map(id => all[id]));
		if (mode === 'rank') return sortByRank(human.hand.map(id => all[id]));
		return human.hand.map(id => all[id]);
	});

	function handleCardSelect(cardId: string) {
		onCardSelect(cardId, !selectedCards.getState().has(cardId));
	}

	function toggleSort(mode: 'suit' | 'rank') {
		const current = getSortMode();
		if (current === mode) {
			appStore.update(s => ({ ...s, sortMode: null }));
		} else {
			selectedCards.set(new SvelteSet());
			appStore.update(s => ({ ...s, sortMode: mode }));
		}
	}

	function isSelected(cardId: string): boolean {
		return selectedCards.getState().has(cardId);
	}

	const isSuitSorting = $derived(getSortMode() === 'suit');
	const isRankSorting = $derived(getSortMode() === 'rank');
</script>

<!-- Sort controls -->
<div class="flex gap-2 mb-2 justify-center">
	<button type="button"
		class:list={[
			'px-3 py-1 text-xs rounded bg-[#4a7a5c] text-white hover:bg-[#6aa078] cursor-pointer',
			isSuitSorting ? 'ring-2 ring-[#f5d442]' : ''
		]}
		onclick={() => toggleSort('suit')}>
		Sort by Suit
	</button>
	<button type="button"
		class:list={[
			'px-3 py-1 text-xs rounded bg-[#4a7a5c] text-white hover:bg-[#6aa078] cursor-pointer',
			isRankSorting ? 'ring-2 ring-[#f5d442]' : ''
		]}
		onclick={() => toggleSort('rank')}>
		Sort by Rank
	</button>
</div>

<!-- Hand display -->
<div class="flex flex-wrap gap-1.5 min-h-[96px] p-3 bg-[#1f3a28] rounded-lg border border-[#4a7a5c] justify-center">
	{#each sortedHand as card (card.id)}
		{#if card}
			<Card cardId={card.id} allCards={game.allCards} selectable on:select={() => handleCardSelect(card.id)} />
		{/if}
	{/each}
</div>
