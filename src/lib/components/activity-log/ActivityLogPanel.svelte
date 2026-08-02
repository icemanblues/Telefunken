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
			{#each entries as entry, index (index + '-' + entry.timestamp)}
				<ActionCard {entry} cardClass={getActionClass(entry.action)} />
			{/each}
			{#if entries.length === 0}
				<p class="opacity-30 text-center py-4 text-xs italic">No activity yet</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	button:hover { opacity: 1 !important; color: inherit; }
	
	::-webkit-scrollbar { width: var(--scrollbar-width); }
	::-webkit-scrollbar-track { background: transparent; }
	::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
</style>
