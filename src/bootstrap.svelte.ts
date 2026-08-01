import { mount } from 'svelte';
import { Game } from './game/engine/game-core.js';
import App from './lib/components/layout/AppLayout.svelte';
import './styles/cards.css';
import { setGame, updatePhase } from './lib/app-state.svelte.js';

const name = 'Player 1';
const game = new Game(name);
setGame(game);

// Sync phase changes into the app store
game.messagesOut.onStateChanged = () => {
  updatePhase(game.state);
};

const target = document.getElementById('app');
if (!target) throw new Error('#app element not found in index.html');

mount(App, { target, props: { game } });
