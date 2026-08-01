<script lang="ts">
	import { toasts } from '../../toast-store.svelte.js';
	
	let containerEl: HTMLDivElement | null = $state(null);
	let currentToasts = $derived(toasts);

	$effect(() => {
		if (containerEl) {
			containerEl.scrollTop = 0;
		}
	});
</script>

<div bind:this={containerEl} class="fixed top-4 left-1/2 z-50 flex flex-col gap-2 pointer-events-none" 
     style="transform: translateX(-50%); max-width: calc(100vw - 2rem);">
	{#each currentToasts as toast (toast.id)}
		<div class="bg-emerald-600 text-white px-4 py-2 rounded shadow-lg text-sm animate-fade-in">
			{toast.msg}
		</div>
	{/each}
</div>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(-8px); }
		to   { opacity: 1; transform: translateY(0); }
	}
	.animate-fade-in {
		animation: fade-in 0.2s ease-out forwards;
	}
</style>
