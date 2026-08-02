<script lang="ts">
	import type { Game } from '../../../game/engine/game-core.js';
	import { CONTRACTS } from '../../../game/contracts.js';
	let { game }: { game: Game } = $props();
</script>

<section class="bg-[#2c2c2c] px-6 py-3 rounded-lg text-center text-xl tracking-wide select-none w-full max-w-screen-md">
	<span class="text-[#f5d442]">{game.dealNumber}</span> &middot; Contract:
	<span class="font-mono">
		{CONTRACTS[game.dealNumber - 1]?.count ?? '\u2014'}\u00d7{CONTRACTS[game.dealNumber - 1]?.minSize ?? '\u2014'}
	</span>
</section>
