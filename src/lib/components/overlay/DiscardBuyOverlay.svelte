<script lang="ts">
	import type { Game } from '../../../game/index.js';
	import * as CardType from '../../../game/card.js';
	
	let { 
		game, 
		visible = false,
		onYes,
		onNo 
	}: { 
		game: Game;
		visible: boolean;
		onYes?: () => void;
		onNo?: () => void;
	} = $props();

	const promptIdx = $derived(game.discardBuyerPromptIndex);
	const player = $derived.by(() => {
		if (promptIdx < 0 || promptIdx >= game.players.length) return null;
		return game.players[promptIdx];
	});

	const topDiscardId = $derived.by(() => {
		if (game.discardPile.length === 0) return null;
		return game.discardPile[game.discardPile.length - 1];
	});

	const topCard = $derived(topDiscardId ? game.allCards[topDiscardId] : null);

	function handleYes() {
		if (onYes) onYes();
	}

	function handleNo() {
		if (onNo) onNo();
	}
</script>

{#if visible && player}
	<div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.6);">
		<div class="bg-[#2c2c2c] rounded-xl p-6 w-full max-w-sm mx-4 text-[#f0e6d3] shadow-2xl animate-card-enter">
			
			<h2 class="text-lg font-bold text-center text-[#f5d442] mb-4">Buy the discard?</h2>
			
			<p class="text-center opacity-80">
				<strong>{player.name}</strong>'s turn to decide.
			</p>

			{#if topCard}
				<div class="flex justify-center my-4">
					<div class="px-6 py-3 bg-[#f5d442]/10 rounded-lg border border-[#f5d442]/30">
						<span class="text-xs opacity-60 uppercase tracking-wider block text-center mb-1">Top Card</span>
						{#if topCard.isJoker}
							<span class="text-2xl font-mono text-purple-400">JOKER</span>
						{:else}
							<span class="font-mono text-2xl" style="color: {['hearts', 'diamonds'].includes(topCard.suit) ? '#f5d442' : '#f0e6d3'}">
								{topCard.rank}{
									topCard.suit === 'hearts' ? '\u2665' : 
									topCard.suit === 'diamonds' ? '\u2666' : 
									topCard.suit === 'clubs' ? '\u2663' : ''
								}
							</span>
						{/if}
					</div>
				</div>
			{/if}

			<div class="text-xs text-center opacity-50 mb-4">
				Costs 1 chip
			</div>
			
			<div class="flex gap-3">
				<button onclick={handleYes} 
					disabled={!player.chips || !game.discardPile.length}
					class="flex-1 py-2.5 bg-[#f5d442] text-black font-semibold rounded hover:bg-[#e5c432] transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none">
					Buy Card
				</button>
				<button onclick={handleNo} 
					class="flex-1 py-2.5 border border-[#ffffff20] text-[#f0e6d3] font-semibold rounded hover:bg-[#ffffff10] transition-colors focus:outline-none">
					Pass
				</button>
			</div>
			
		</div>
	</div>
{/if}

<style>
	@keyframes card-enter {
		from { opacity: 0; transform: scale(0.95); }
		to   { opacity: 1; transform: scale(1); }
	}
	.animate-card-enter {
		animation: card-enter 0.2s ease-out forwards;
	}
</style>
