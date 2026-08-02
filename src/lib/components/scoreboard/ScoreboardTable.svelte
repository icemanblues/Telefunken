<script lang="ts">
	import type { Game } from '../../../game/engine/game-core.js';
	import ScoreboardRow from './ScoreboardRow.svelte';
	let { game }: { game: Game } = $props();
</script>

<table class="w-full text-sm border-collapse">
	<thead>
		<tr class="text-left text-slate-400 border-b border-slate-600">
			<th class="px-4 py-2 font-medium">Player</th>
			<th class="px-4 py-2 font-medium text-center">Cards</th>
			<th class="px-4 py-2 font-medium text-center">Chips</th>
			<th class="px-4 py-2 font-medium text-center">Score</th>
			<th class="px-4 py-2 font-medium text-center">Status</th>
		</tr>
	</thead>
	<tbody>
		{#each game.players as player}
			<ScoreboardRow {player} {game} />
		{/each}
	</tbody>
</table>
