<script lang="ts">
	import ActionCard from './ActionCard.svelte';
	import type { Game } from '../../../game/index.js';
	import * as ActivityLogHelper from '../../activity-log-helpers.svelte.js';
	
	type T = import('../../../game/activity-log/entry.js').ActionLogEntry;

	let { game }: { game: Game } = $props();
	let collapsed = $state(false);
	let listEl: HTMLDivElement | null = $state(null);

	const entries = $derived(game.activityLog.entries) as readonly T[];

	$effect(() => {
		if (listEl) {
			listEl.scrollTop = listEl.scrollHeight;
		}
	});

	function getActionClass(action: string): string {
		return ActivityLogHelper.getActionClassFromString(action);
	}
</script>

<div class="bg-[#1a3c2a]/80 rounded-lg overflow-hidden flex flex-col w-full max-w-sm">
	<button onclick={() => collapsed = !collapsed} 
		class="px-3 py-2 text-xs uppercase tracking-wide opacity-60 hover:opacity-90 cursor-pointer select-none bg-transparent border-0 text-inherit">
		Activity Log [{collapsed ? '▶' : '▼'}]
	</button>
	
	{#if !collapsed}
		<div bind:this={listEl} class="overflow-y-auto max-h-[40vh] px-1 space-y-px bg-transparent text-sm" style="--scrollbar-width: 4px;">
			{#each entries as entry, index}
				<ActionCard key={(String(entry.timestamp) + '-' + index)} entry={entry} cardClass={getActionClass(entry.action)} />
			{/each}
			{#if entries.length === 0}
				<p class="opacity-30 text-center py-4 text-xs italic">No activity yet</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	button:hover { opacity: 1 !important; color: inherit; }
	
	/* Action card class mappings from ui.ts */
	.action-new      { background: rgba(34, 197, 94, 0.1);   border-left: 3px solid #22c55e; padding-left: 8px; margin-left: -11px; }
	.action-over     { background: rgba(239, 68, 68, 0.1);    border-left: 3px solid #ef4444; padding-left: 8px; margin-left: -11px; }
	.action-draw     { background: rgba(59, 130, 246, 0.1);   border-left: 3px solid #3b82f6; padding-left: 8px; margin-left: -11px; }
	.action-meld     { background: rgba(168, 85, 247, 0.1);   border-left: 3px solid #a855f7; padding-left: 8px; margin-left: -11px; }
	.action-add      { background: rgba(249, 115, 22, 0.1);   border-left: 3px solid #f97316; padding-left: 8px; margin-left: -11px; }
	.action-buy      { background: rgba(234, 179, 8, 0.1);    border-left: 3px solid #eab308; padding-left: 8px; margin-left: -11px; }
	.action-discard  { background: rgba(156, 163, 175, 0.1);  border-left: 3px solid #9ca3af; padding-left: 8px; margin-left: -11px; }

	.action-player   { font-weight: 500; color: #f5d442; }
</style>
