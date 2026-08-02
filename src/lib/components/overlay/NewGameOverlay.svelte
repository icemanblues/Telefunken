<script lang="ts">
	import { CONTRACTS } from '../../../game/contracts.js';
	
	let { 
		onStart,
		playerName = 'Player 1',
		defaultSeed 
	}: { 
		onStart?: (data: { name: string; seed: string | number | null }) => void;
		playerName: string;
		defaultSeed?: number | null;
	} = $props();

	function initialName(): string {
		let n = playerName ?? 'Player 1';
		return typeof n === 'string' && n.trim() !== '' ? n : 'Player 1';
	}

	function initialSeedStr(): string {
		if (defaultSeed !== undefined && defaultSeed !== null) {
			return String(defaultSeed);
		}
		return '';
	}

	let nameInput = $state(initialName());
	let seedStr = $state(initialSeedStr());
	
	function validateForm(): { valid: boolean; name: string; seed: string | number | null } {
		const n = nameInput.trim() || 'Player 1';
		
		if (seedStr.trim()) {
			const parsed = parseInt(seedStr.trim(), 10);
			return { valid: !isNaN(parsed), name: n, seed: parsed };
		}
		
		return { valid: true, name: n, seed: null };
	}

	function handleStart() {
		const result = validateForm();
		if (result.valid && onStart) {
			onStart(result);
			nameInput = result.name;
			seedStr = '';
		}
	}
	
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleStart();
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.6);">
	<div class="bg-[#2c2c2c] rounded-xl p-6 w-full max-w-lg mx-4 space-y-5 text-[#f0e6d3] shadow-2xl animate-card-enter">
		
		<h2 class="text-xl font-bold text-center text-[#f5d442] tracking-wide">New Game</h2>
		
		<div class="space-y-1">
			<label for="name-input" class="block text-sm opacity-70">Player Name</label>
			<input id="name-input" type="text" bind:value={nameInput}
				class="w-full px-3 py-2 bg-transparent border border-[#444] rounded focus:border-[#f5d442] outline-none text-sm" />
		</div>
		
		<div class="space-y-1">
			<label for="seed-input" class="block text-sm opacity-70">Seed (optional, leave blank for random)</label>
			<input id="seed-input" type="number" bind:value={seedStr}
				class="w-full px-3 py-2 bg-transparent border border-[#444] rounded focus:border-[#f5d442] outline-none text-sm font-mono" />
		</div>
		
		<div class="bg-[#1a3c2a]/60 rounded-lg p-4">
			<h3 class="text-xs uppercase tracking-wider opacity-50 mb-2">Contracts (6 deals)</h3>
			<table class="w-full text-sm">
				<thead>
					<tr class="opacity-50 text-xs">
						<th class="text-left font-normal pr-4">Deal</th>
						<th class="font-normal">Requirement</th>
					</tr>
				</thead>
				<tbody>
					{#each CONTRACTS as contract, i}
						<tr class="border-t border-[#ffffff10]">
							<td class="py-1 pr-4 opacity-70">{i + 1}</td>
							<td><span class="font-mono text-[#f5d442]">{contract.count}×</span> {contract.minSize}-set</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		
		<div class="text-xs opacity-50 space-y-1">
			<p class="font-semibold mb-1">Scoring Reference:</p>
			<p>Ace = 15 pts; Two / Joker = 20 pts</p>
			<p>Tens / Jacks / Queens / Kings = 10 pts each</p>
			<p>All others = face value</p>
		</div>
		
		<button onclick={handleStart} 
			class="w-full py-2.5 bg-[#f5d442] text-black font-semibold rounded hover:bg-[#e5c432] transition-colors focus:outline-none focus:ring-2 focus:ring-[#f5d442]">
			Start Game
		</button>
		
	</div>
</div>

<style>
	@keyframes card-enter {
		from { opacity: 0; transform: scale(0.95) translateY(8px); }
		to   { opacity: 1; transform: scale(1) translateY(0); }
	}
	.animate-card-enter {
		animation: card-enter 0.2s ease-out forwards;
	}
</style>
