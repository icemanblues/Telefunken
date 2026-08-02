<script lang="ts">
	import type { Game } from '../../../game/engine/game-core.js';
	import type { Meld } from '../../../game/meld.js';
	import Card from '../../../components/card/Card.svelte';

	let { meld, game }: { meld: Meld; game: Game } = $props();
	const ownerName = $derived(game.players[meld.owner]?.name ?? '');
</script>

<div class="meld-group">
	<div class="meld-owner-label">
		{ownerName}'s {meld.type}{meld.isContract ? ' (contract)' : ''}
	</div>
	<div class="flex flex-wrap gap-1.5">
		{#each meld.cards as card}
			<Card cardId={card.id} allCards={game.allCards} />
		{/each}
	</div>
</div>

