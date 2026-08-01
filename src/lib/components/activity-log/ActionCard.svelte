<script lang="ts">
	import type { ActionLogEntry } from '../../../game/activity-log/entry.js';
	let { entry, cardClass }: { entry: ActionLogEntry; cardClass: string } = $props();
</script>

<div class="action-card {cardClass} px-3 py-1.5 rounded text-sm flex gap-2 items-center border-l-4 w-full mb-0.5">
	<span class="action-player opacity-70 w-16 shrink-0">{entry.player}</span>
	{#if entry.dealNumber > 0}
		<span class="opacity-50 text-[10px] uppercase tracking-wider">Round {entry.dealNumber}</span>
	{/if}
	<span class="action-detail opacity-90">{entry.detail || entry.action}</span>
</div>
