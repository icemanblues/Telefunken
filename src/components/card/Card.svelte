<script lang="ts">
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

	const suitSymbols: Record<string, string> = {
		hearts: '\u2665',
		diamonds: '\u2666',
		clubs: '\u2663',
		spades: '\u2660',
		joker: String.fromCodePoint(0x1f0cf),
	};

	let selected = $state(false);

	const card: Partial<Card> | null = $derived(allCards?.[cardId] ?? null);
	const rankLabel = $derived(card?.isJoker ? 'JOKER' : String(card?.rank ?? ''));
	const suitSymbol = $derived(card?.suit ? (suitSymbols[card.suit ?? ''] ?? '') : '');
	const isRed = $derived(card && !card.isJoker && ['hearts', 'diamonds'].includes(card.suit ?? ''));

	function handleClick() {
		if (!selectable) return;
		selected = !selected;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter' && e.key !== ' ') return;
		e.preventDefault();
		handleClick();
	}
</script>

<style>
	.card-wrap {
		width: 66px;
		height: 92px;
		border-radius: 6px;
		background: #fff;
		color: var(--card-color, #222);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		user-select: none;
		font-size: 0.95rem;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		transition: outline-color 0.18s ease, transform 0.16s ease, background 0.2s ease, box-shadow 0.2s ease;
		position: relative;
		outline: none;
	}

	.card-wrap.selected {
		outline: 3px solid #f5d442;
		transform: translateY(-4px);
		box-shadow: 0 0 12px rgba(245, 212, 66, 0.55);
	}

	.card-wrap.red { color: #c0392b; }
	.card-wrap.black { color: #222; }
	.card-wrap.joker { color: #9c27b0; }
</style>

{#if card}
	<button type="button" class="card-wrap {selected ? 'selected' : ''} {isRed ? 'red' : card.isJoker ? 'joker' : 'black'}" onclick={handleClick} onkeydown={handleKeydown} aria-label="{rankLabel}{suitSymbol} card">
		<span>{rankLabel}</span>
		<span style="font-size: 1.3rem;">{suitSymbol}</span>
	</button>
{/if}
