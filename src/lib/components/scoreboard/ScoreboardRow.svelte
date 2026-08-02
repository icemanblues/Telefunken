<script lang="ts">
	import type { Game } from '../../../game/engine/game-core.js';
	let { game, player }: { game: Game; player: import('../../../game/players/player.js').Player } = $props();
	const dealerIdx = $derived(game.getDealerIndex(game.dealNumber));
	const isActive = $derived(game.currentPlayerIndex === player.id);
	const isDealer = $derived(dealerIdx === player.id);

	function displayName(): string {
		if (isActive && isDealer) return '\u25BA [D] ' + player.name;
		if (isActive) return '\u25BA ' + player.name;
		if (isDealer) return '[D] ' + player.name;
		return player.name;
	}

	const cardCount = $derived(player.isHuman ? String(player.hand.length) : '?');
	const outStatus = $derived(player.hand.length === 0 && game.state === 'dealover' ? 'OUT' : '');
	const isActiveHighlight = $derived(isActive);
	const showOut = $derived(outStatus !== '');
</script>

<tr class:list={[
	'border-b border-slate-700 hover:bg-slate-800/50',
	isActiveHighlight ? 'bg-blue-900/30 ring-2 ring-blue-400' : ''
]}>
	<td class="px-4 py-2 whitespace-nowrap font-medium">{displayName()}</td>
	<td class="px-4 py-2 text-center">{cardCount}</td>
	<td class="px-4 py-2 text-center">{player.chips}</td>
	<td class="px-4 py-2 text-center font-mono">{player.score}</td>
	<td class:list={['px-4 py-2 text-center', showOut ? 'text-red-400 font-bold' : 'text-slate-500']}>{outStatus || '\u2014'}</td>
</tr>
