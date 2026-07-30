import { mount } from 'svelte';
import { Game } from './game/engine/game-core.js';
import App from './components/layout/AppLayout.svelte';
import './styles/cards.css';

const name = 'Player 1';
const game = new Game(name);
mount(App, { target: document.getElementById('app')!, props: { game } });
