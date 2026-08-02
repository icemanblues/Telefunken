<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Card as CardType } from '../../game/card.js';
	type Card = InstanceType<typeof CardType>;

	let {
		cardId,
		allCards,
		selectable = false,
	}: {
		cardId: string;
		allCards: Record<string, Partial<Card>>;
		selectable?: boolean;
	} = $props();

	const dispatch = createEventDispatcher<{ select: { cardId: string } }>();

	const suitSymbols: Record<string, string> = {
		hearts: '\u2665',
		diamonds: '\u2666',
		clubs: '\u2663',
		spades: '\u2660',
		joker: String.fromCodePoint(0x1f0cf),
	};

	let toggleCount = $state(0);
	let selected = $derived(toggleCount % 2 === 1);

	const card: Partial<Card> | null = $derived(allCards?.[cardId] ?? null);
	const rankLabel = $derived(card?.isJoker ? 'JOKER' : String(card?.rank ?? ''));
	const suitSymbol = $derived(card?.suit ? (suitSymbols[card.suit ?? ''] ?? '') : '');
	const isRed = $derived(card && !card.isJoker && ['hearts', 'diamonds'].includes(card.suit ?? ''));

	function handleClick() {
		if (!selectable) return;
		toggleCount++;
		dispatch('select', { cardId });
	}
</script>

{#if card}
	<button type="button" class:list={[
			'card',
			selected ? 'selected' : '',
			isRed ? 'card-red' : card.isJoker ? 'card-joker' : 'card-dark-on-white',
			'w-[66px] h-[92px] rounded-[6px] bg-white inline-flex flex-col items-center justify-center cursor-pointer select-none text-[0.95rem]'
		]}
		onclick={handleClick}>
		<span>{rankLabel}</span>
		<span style="font-size:1.3rem">{suitSymbol}</span>
	</button>
{/if}
