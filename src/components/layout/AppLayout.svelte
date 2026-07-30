<script lang="ts">
	import Card from '../card/Card.svelte';
	import { CONTRACTS } from '../../game/contracts.js';
	import { Card as CardType } from '../../game/card.js';
	type Game = import('../../game/index.js').Game;

	let { game }: { game: import('../../game/index.js').Game } = $props();

	const _phaseAScaffold = import.meta.env.DEV && false;

	const testCards: Record<string, { suit: string; rank: number | string; isJoker: boolean }> = $derived.by(() => _phaseAScaffold ? {
		'test-hearts-2':   { suit: 'hearts',     rank: 2, isJoker: false },
		'test-spades-A':   { suit: 'spades',     rank: 14, isJoker: false },
		'test-joker-1':    { suit: 'joker',      rank: 'joker', isJoker: true },
		'test-diamonds-K': { suit: 'diamonds',   rank: 13, isJoker: false },
		'test-clubs-Q':    { suit: 'clubs',      rank: 12, isJoker: false },
	} : {} as Record<string, { suit: string; rank: number | string; isJoker: boolean }>);

	const testCardIds = Object.keys(testCards);
</script>

<svelte:head>
	<title>Telefunken — Peru v1</title>
</svelte:head>

<div id="app" class="min-h-screen bg-[#1a3c2a] text-[#f0e6d3] flex flex-col gap-3 p-4 items-center">
	<h1 class="text-2xl font-bold text-[#f5d442] tracking-wide">Telefunken — Peru v1</h1>

	<section class="bg-[#2c2c2c] px-6 py-3 rounded-lg text-center text-xl tracking-wide select-none w-full max-w-screen-md mb-4">
		<span class="text-[#f5d442]">{game.dealNumber}</span> &middot; Contract: <span class="font-mono">{CONTRACTS[game.dealNumber - 1].count}x{CONTRACTS[game.dealNumber - 1].minSize}</span>
	</section>

	<section class="bg-emerald-800 rounded-lg p-6 shadow-xl max-w-md w-full space-y-4">
		<p class="text-sm opacity-80">Phase A: Svelte 5 + Tailwind v4 scaffold</p>

		<div class="flex flex-wrap gap-3 justify-center pt-2">
			<Card cardId={testCardIds[0]} allCards={testCards as Record<string, Partial<CardType>>} />
			<Card cardId={testCardIds[1]} allCards={testCards as Record<string, Partial<CardType>>} />
			<Card cardId={testCardIds[2]} allCards={testCards as Record<string, Partial<CardType>>} selectable={true} />
			<Card cardId={testCardIds[3]} allCards={testCards as Record<string, Partial<CardType>>} />
			<Card cardId={testCardIds[4]} allCards={testCards as Record<string, Partial<CardType>>} />
		</div>

		<div class="text-xs opacity-60 text-center pt-2">
			<p>Svelte 5 &middot; Tailwind v4</p>
		</div>
	</section>
</div>
