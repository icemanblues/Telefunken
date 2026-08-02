<script lang="ts">
	let { deferredPrompt }: { deferredPrompt: BeforeInstallPromptEvent | null } = $props();
	let dismissed = $state(false);

	function handleInstall() {
		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		deferredPrompt.userChoice.then((choice: { outcome: 'accepted' | 'dismissed' }) => {
			if (choice.outcome === 'accepted') {
				console.info('[Telefunken-PWA] Install accepted');
			}
			dismissed = true;
		});
	}
</script>

{#if !dismissed && deferredPrompt}
	<div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50" role="alert">
		<div class="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 shadow-xl flex items-center gap-3 max-w-sm w-full">
			<span class="text-[#f5d442] text-sm flex-1">Add Telefunken to your home screen</span>
			<button
				class="px-3 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer transition-colors"
				on:click={handleInstall}
			>Add
			</button>
			<button
				class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer rounded transition-colors"
				on:click={() => dismissed = true}
				aria-label="Dismiss"
			>&times;</button>
		</div>
	</div>
{/if}
