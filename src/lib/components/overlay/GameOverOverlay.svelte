	<script lang="ts">
	import type { Game } from '../../../game/index.js';
	type T = import('../../../game/engine/scoreboard.js').LeaderboardEntry;

	let { 
		game, 
		visible = false,
		onRestart 
	}: { 
		game: Game;
		visible: boolean;
		onRestart?: () => void;
	} = $props();

	const leaderboard = $derived.by(() => {
		if (game.state !== 'gameover') return [];
		
		const g = game;
		const sorted = [...g.players].sort((a, b) => a.score - b.score);
		const dealerIdx = g.getDealerIndex(g.dealNumber);
		
		return sorted.map((player, rankIdx) => ({
			rank: rankIdx + 1,
			player,
			penaltyScore: player.score + player.chips * 10,
			chipBonus: player.chips * 10,
			total: player.score,
			isActivePlayer: g.currentPlayerIndex === player.id,
			isDealer: dealerIdx === player.id,
		}));
	});

	const winner = $derived(leaderboard.length > 0 ? leaderboard[0] : null);
</script>

{#if visible && leaderboard.length > 0}
	<div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.6);">
		<div class="bg-[#2c2c2c] rounded-xl p-6 w-full max-w-sm mx-4 text-[#f0e6d3] shadow-2xl animate-card-enter">
			
			<h2 class="text-xl font-bold text-center text-[#f5d442] tracking-wide mb-4">Game Over</h2>
			
			{#if winner}
				<p class="text-center text-lg mb-4">
					<span class="text-[#f5d442]">🏆 {winner.player.name} wins with {winner.total} points!</span>
				</p>
			{/if}
			
			<table class="w-full text-sm mb-4">
				<thead>
					<tr class="opacity-50 text-xs uppercase tracking-wider border-b border-[#ffffff10]">
						<th class="text-left py-2 font-normal pr-4">#</th>
						<th class="text-left py-2 font-normal">Player</th>
						<th class="text-right py-2 font-normal">Score</th>
						<th class="text-right py-2 font-normal">Chips ×10</th>
						<th class="text-right py-2 font-normal">Total</th>
					</tr>
				</thead>
				<tbody>
					{#each leaderboard as entry}
						<tr style="background: {entry.rank === 1 ? 'rgba(245, 212, 66, 0.08)' : 'transparent'}" class="border-b border-[#ffffff08]">
							<td class="py-2 pr-4 opacity-70 text-center font-semibold">{entry.rank}</td>
							<td class="py-2 pr-4">
								<span class="inline-block min-w-[1px]">{entry.player.name}</span>
								{#if entry.isDealer}<span class="text-xs opacity-50 ml-1">[D]</span>{/if}
							</td>
							<td class="py-2 text-right font-mono">{entry.penaltyScore}</td>
							<td class="py-2 text-right font-mono opacity-60">+{entry.chipBonus}</td>
							<td class="py-2 text-right font-mono font-bold" style="color: {entry.rank === 1 ? '#f5d442' : 'inherit'}">{entry.total}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			
			<div class="text-xs text-center opacity-40 mb-4">
				Seed: {typeof game.seed === 'number' ? game.seed : '--'}
			</div>
			
			<div class="flex gap-3">
				<button onclick={() => onRestart?.()} 
					class="flex-1 py-2 bg-[#f5d442] text-black font-semibold rounded hover:bg-[#e5c432] transition-colors focus:outline-none">
					Play Again
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