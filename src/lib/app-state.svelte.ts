import { SvelteSet } from 'svelte/reactivity';
import { writable } from 'svelte/store';
import type { Game } from '../game/engine/game-core.js';
import type { GameState } from '../game/types.js';

export const appStore = writable<AppState>({
	game: null as Game | null,
	phase: 'init' as GameState,
	sortMode: null as null | 'rank' | 'suit',
});

export interface AppState {
	game: Game | null;
	phase: GameState;
	sortMode: null | 'rank' | 'suit';
}

export function setGame(game: Game) {
	appStore.update(s => ({ ...s, game, phase: game.state }));
}

export function updatePhase(phase: GameState) {
	appStore.update(s => ({ ...s, phase }));
}

export function setSortMode(mode: null | 'rank' | 'suit') {
	appStore.update(s => ({ ...s, sortMode: mode }));
}

export const selectedCards = writable(new SvelteSet<string>());

export function toggleSelectedCard(cardId: string) {
	selectedCards.update(s => {
		if (s.has(cardId)) s.delete(cardId);
		else s.add(cardId);
		return s;
	});
}

export function clearSelection() {
	selectedCards.set(new SvelteSet());
}
