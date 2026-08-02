import { SvelteSet } from 'svelte/reactivity';
import { writable } from 'svelte/store';
import type { Game } from '../game/engine/game-core.js';
import type { GameState } from '../game/types.js';

export interface AppState {
	game: Game | null;
	phase: GameState;
	sortMode: null | 'rank' | 'suit';
}

const _defaultApp = {
	game: null as Game | null,
	phase: 'init' as GameState,
	sortMode: null as null | 'rank' | 'suit',
};

export const appStore = writable<AppState>(_defaultApp);

export function setGame(game: Game) {
	appStore.update(s => ({ ...s, game, phase: game.state }));
}

export function updatePhase(state: GameState) {
	appStore.update(s => ({ ...s, phase: state }));
}

export function setSortMode(mode: null | 'rank' | 'suit') {
	appStore.update(s => ({ ...s, sortMode: mode }));
}

export const selectedCards = writable<SvelteSet<string>>(new SvelteSet());

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

/** Set the selection store to empty — accepts a plain Set or SvelteSet. */
export function resetSelectedCards(val: Set<string> = new SvelteSet()) {
	const target = val instanceof SvelteSet ? val : new SvelteSet(val);
	selectedCards.set(target);
}
