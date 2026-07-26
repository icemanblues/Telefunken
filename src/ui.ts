import { Card, Deck, Meld, Player, Game, sortByRank, sortBySuit, ActionLogEntry } from './game/game.js';
import type { Suit, CardRank, MeldType, GameState, Contract, StateEvent } from './game/game.js';
import { CONTRACTS } from './game/game.js';

if (typeof window !== 'undefined') {
  const suitSymbol: Record<string, string> = { hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663', spades: '\u2660', joker: String.fromCodePoint(0x1F0CF) };
  const rankLabel: Record<string, string> = { '2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9','10':'10','11':'J',12:'Q',13:'K',14:'A', joker:'' };

  let toastTimeout: ReturnType<typeof setTimeout> | null = null;
  function showToast(msg: string, duration?: number): void {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const existing = container.querySelector('.toast');
    if (existing) existing.remove();
    if (toastTimeout) clearTimeout(toastTimeout);
    const t = document.createElement('div');
    t.className = 'toast card-enter';
    t.textContent = msg;
    container.appendChild(t);
    toastTimeout = setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 200);
    }, duration || 2400);
  }

  let discardMode = false;
  let currentSortMode: null | 'suit' | 'rank' = null;

  let actionLogEntries: Array<ActionLogEntry> = [];
  const MAX_LOG_ENTRIES = 200;

  function getActionCardClass(entry: ActionLogEntry): string {
    if (entry.action.includes('New Game')) return 'action-new';
    if (entry.action === 'Game Over') return 'action-over';
    if (entry.action.includes('Started Turn')) return 'action-draw';
    if (entry.action.includes('Played Set')) return 'action-meld';
    if (entry.action.includes('Played Run')) return 'action-meld';
    if (entry.action === 'Add to Meld') return 'action-add';
    if (entry.action === 'Bought Card') return 'action-buy';
    if (entry.action === 'Discarded') return 'action-discard';
    return '';
  }

  function renderActivityLog(): void {
    const logEntries = document.getElementById('log-entries');
    if (!logEntries) return;
    logEntries.innerHTML = '';

    for (const entry of actionLogEntries) {
      const card = document.createElement('div');
      card.className = `action-card ${getActionCardClass(entry)} card-enter`;

      const playerEl = document.createElement('span');
      playerEl.className = 'action-player';
      playerEl.textContent = entry.player;

      const metaEl = document.createElement('span');
      metaEl.className = 'action-meta';
      if (entry.dealNumber > 0) {
        metaEl.textContent = `Round ${entry.dealNumber}`;
      } else {
        metaEl.textContent = '';
      }

      const detailEl = document.createElement('span');
      detailEl.className = 'action-detail';
      detailEl.textContent = entry.detail || entry.action;

      card.appendChild(playerEl);
      if (metaEl.textContent) card.insertBefore(metaEl, playerEl.nextSibling ? playerEl.nextSibling : null);
      card.appendChild(detailEl);
      logEntries.appendChild(card);
    }

    logEntries.scrollTop = logEntries.scrollHeight;
  }

  function pushActionLogEntry(entry: ActionLogEntry): void {
    actionLogEntries.push(entry);
    if (actionLogEntries.length > MAX_LOG_ENTRIES) {
      actionLogEntries.shift();
    }
    renderActivityLog();
  }

  let game: Game | null = null;

  function cardElement(cardId: string, allCards: Record<string, Card>, selectable: boolean): HTMLElement | null {
    const card = allCards[cardId];
    if (!card) return null;
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.cardId = cardId;
    if (card.isJoker) {
      el.classList.add('card-joker');
      el.textContent = 'JOKER';
    } else {
      const colorClass = (card.suit === 'hearts' || card.suit === 'diamonds') ? 'card-red' : 'card-dark-on-white';
      el.classList.add(colorClass);
      el.innerHTML = `<span>${rankLabel[String(card.rank)]}</span><span style="font-size:1.3rem">${suitSymbol[card.suit]}</span>`;
    }
    if (selectable) {
      el.addEventListener('click', () => {
        if (discardMode && game.state === 'discard' && game.currentPlayerIndex === 0) {
          const clickedId = el.dataset.cardId;
          const ok = game.discardCard(0, clickedId);
          discardMode = false;
          if (ok) showToast('Card discarded.');
          else showToast('Discard failed — check eligibility.');
        } else {
          el.classList.toggle('selected');
        }
      });
    }
    return el;
  }

  function renderBoard(g: Game): void {
    const contract = CONTRACTS[g.dealNumber - 1] || null;

    document.getElementById('deal-label')!.textContent = `Deal #${g.dealNumber}`;
    document.getElementById('contract-label')!.textContent = contract
      ? `Contract: ${contract.count}\u00D7${contract.minSize}`
      : 'Game Over';

    const tbody = document.getElementById('scoreboard-body') as HTMLTableSectionElement;
    tbody.innerHTML = '';
    for (const p of g.players) {
      const tr = document.createElement('tr');
      if (!p.isHuman && !p.hand.length) { /* only show hand count for AI */ }
      const cells: string[] = [
        p.name,
        p.isHuman ? String(p.handCardCount) : '?',
        String(p.chips),
        String(p.score),
        g.currentPlayerIndex === p.id ? '\u25B6 ACTIVE' : (p.hand.length === 0 && g.state === 'dealover') ? 'OUT' : '',
      ];
      for (const txt of cells) {
        const td = document.createElement('td');
        td.textContent = txt;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    const mc = document.getElementById('melds-container') as HTMLDivElement;
    mc!.innerHTML = '';
    for (const meld of game.tableMelds) {
      const group = document.createElement('div');
      group.className = 'meld-group';
      const label = document.createElement('div');
      label.className = 'meld-owner-label';
      label.textContent = `${game.players[meld.owner].name}'s ${meld.type}${meld.isContract ? ' (contract)' : ''}`;
      group.appendChild(label);
      const cardsRow = document.createElement('div');
      cardsRow.style.display = 'flex';
      cardsRow.style.gap = '4px';
      for (const c of meld.cards) {
        cardsRow.appendChild(cardElement(c.id, game.allCards, false)!);
      }
      group.appendChild(cardsRow);
      mc.appendChild(group);
    }

    const addSel = document.getElementById('add-meld-target') as HTMLSelectElement | null;
    if (addSel) {
      addSel.innerHTML = '';
      for (let i = 0; i < game.tableMelds.length; i++) {
        const m = game.tableMelds[i];
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = `${game.players[m.owner].name}'s ${m.type} (${m.cards.length} cards)`;
        addSel.appendChild(opt);
      }
    }

    document.getElementById('stock-count')!.textContent = g.deck ? String(g.deck.remaining) : '0';
    const dtEl = document.getElementById('discard-top') as HTMLSpanElement | null;
    if (dtEl) {
      dtEl.innerHTML = '';
      if (g.discardPile.length) {
        const topId = g.discardPile[g.discardPile.length - 1];
        const card = g.getCard(topId);
        if (card) {
          const el = cardElement(topId, g.allCards, false);
          dtEl.appendChild(el!);
        }
      } else {
        dtEl.textContent = '\u2014';
      }
    }

    const hh = document.getElementById('human-hand') as HTMLDivElement;
    if (hh) {
      hh.innerHTML = '';
      const human = game.players[0];

      let cardObjs: Card[];
      if (currentSortMode === 'suit') {
        cardObjs = sortBySuit(human.hand.map(id => game.allCards[id]).filter(Boolean) as Card[]);
      } else if (currentSortMode === 'rank') {
        cardObjs = sortByRank(human.hand.map(id => game.allCards[id]).filter(Boolean) as Card[]);
      } else {
        cardObjs = human.hand.map(id => game.allCards[id]).filter(Boolean) as Card[];
      }

      for (const card of cardObjs) {
        hh.appendChild(cardElement(card.id, game.allCards, true));
      }
    }

    document.getElementById('phase-label').textContent = `Phase: ${game.state}`;

    updateControls(game);

    document.querySelectorAll('.meld-group:last-child').forEach(g => g.classList.add('card-enter'));
  }

  function updateControls(game: Game): void {
    const human = game.players[0];
    const isHumanTurn = (game.currentPlayerIndex === 0);
    const btnBuy = document.getElementById('btn-buy');
    const endTurnBtn = document.getElementById('btn-end-turn');
    const meldControls = document.getElementById('meld-controls');
    const addMeldControls = document.getElementById('add-meld-controls');

    const enable = (el: HTMLElement | null) => { if (el) { el.style.pointerEvents = ''; el.style.opacity = '1'; } };
    const disable = (el: HTMLElement | null) => { if (el) { el.style.pointerEvents = 'none'; el.style.opacity = '0.4'; } };

    if (game.state === 'dealover' || game.state === 'gameover') {
      disable(meldControls); disable(addMeldControls); endTurnBtn!.disabled = true;
      if (game.state === 'gameover') {
        showToast('Game Over — lowest score wins!');
      } else {
        showToast('Deal complete.');
      }
    } else if (isHumanTurn && game.state === 'meld') {
      enable(meldControls); endTurnBtn!.disabled = false;
      if (human.hasMelded) enable(addMeldControls); else disable(addMeldControls);
    } else if (isHumanTurn && game.state === 'discard') {
      discardMode = true; enable(meldControls); disable(addMeldControls); endTurnBtn!.disabled = false;
      showToast('Click a card to discard.');
    } else if (game.state === 'buyDiscard') {
      disable(meldControls); disable(addMeldControls); endTurnBtn!.disabled = true;
      const promptIdx = game.discardBuyerPromptIndex;
      if (promptIdx >= 0 && promptIdx < game.players.length) {
        showToast(`${game.players[promptIdx].name}'s turn to decide.`);
      }
    } else if (isHumanTurn && game.state === 'draw') {
      disable(meldControls); disable(addMeldControls); endTurnBtn!.disabled = true;
    } else {
      disable(meldControls); disable(addMeldControls); endTurnBtn!.disabled = true;
      if (!isHumanTurn && !game.isCurrentPlayerAI()) {
        showToast(`${game.players[game.currentPlayerIndex].name}'s turn.`);
      } else if (game.isCurrentPlayerAI()) {
        showToast(`\uD83E\uDD16 ${game.players[game.currentPlayerIndex].name} is thinking...`);
      }
    }

    if (human.hasMelded || human.chips <= 0 || game.discardPile.length === 0
        || game.state === 'dealover' || game.state === 'gameover' || game.state === 'buyDiscard') {
      btnBuy!.style.display = 'none';
    } else {
      btnBuy!.style.display = '';
    }
  }

  function renderGameOver(): void {
    const overlay = document.getElementById('gameover-container');
    if (!overlay) return;

    const tbody = document.getElementById('leaderboard-body') as HTMLTableSectionElement | null;
    tbody!.innerHTML = '';

    const leaderboard = game!.getLeaderboard();
    for (const entry of leaderboard) {
      const tr = document.createElement('tr');
      if (entry.rank === 1) tr.classList.add('rank-1');
      td(tr, String(entry.rank));
      td(tr, entry.player.name);

      td(tr, `${entry.penaltyScore}`);
      td(tr, `-${entry.chipBonus}`);

      const finalScore = entry.penaltyScore - entry.chipBonus;
      td(tr, `${finalScore}`);

      tbody!.appendChild(tr);
    }

    const winnerEntry = leaderboard[0];
    if (winnerEntry) {
      const winnerTextEl = document.getElementById('winner-text');
      if (winnerTextEl) {
        const finalScore = winnerEntry.penaltyScore + winnerEntry.chipBonus;
        winnerTextEl.textContent = `${winnerEntry.player.name} wins with ${finalScore} points!`;
      }
    }

    overlay.style.display = 'flex';
    overlay.classList.add('card-enter');
  }

  function hideGameOver(): void {
    const overlay = document.getElementById('gameover-container');
    if (overlay) overlay.style.display = 'none';
  }

  function td(parent: HTMLElement, text: string): void {
    const el = document.createElement('td');
    el.textContent = text;
    parent.appendChild(el);
  }

  function initUI(game: Game): void {

    function showNewGameOverlay(): void {
      const overlay = document.getElementById('new-game-overlay');
      if (!overlay) return;
      const input = document.getElementById('player-name-input') as HTMLInputElement | null;
      if (input) input.value = game.playerName || 'Player 1';
      overlay.style.display = 'flex';
    }

    showNewGameOverlay();

    const logPanel = document.getElementById('activity-log');
    if (logPanel) {
      logPanel.classList.remove('collapsed');
    }

    document.getElementById('btn-toggle-log').addEventListener('click', () => {
      if (!logPanel) return;
      logPanel.classList.toggle('collapsed');
    });

    document.getElementById('btn-buy').addEventListener('click', () => {
      game.buyDiscard(0);
    });

    document.getElementById('btn-end-turn').addEventListener('click', () => {
      game.endTurn(0);
    });

    document.getElementById('btn-confirm-set').addEventListener('click', () => {
      const selected = [...document.querySelectorAll('#human-hand .card.selected')] as HTMLElement[];
      const ids = selected.map(el => el.dataset.cardId!).filter(Boolean);
      if (ids.length) {
        const ok = game.playMeld(0, ids, 'set');
        if (!ok) showToast('Invalid set — check eligibility.');
      }
    });

    document.getElementById('btn-confirm-run').addEventListener('click', () => {
      const selected = [...document.querySelectorAll('#human-hand .card.selected')] as HTMLElement[];
      const ids = selected.map(el => el.dataset.cardId!).filter(Boolean);
      if (ids.length) {
        const ok = game.playMeld(0, ids, 'run');
        if (!ok) showToast('Invalid run — check eligibility.');
      }
    });

    document.getElementById('btn-add-meld-toggle').addEventListener('click', () => {
      const optDiv = document.getElementById('add-meld-options');
      if (optDiv) optDiv.style.display = optDiv.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('btn-confirm-add').addEventListener('click', () => {
      const selected = [...document.querySelectorAll('#human-hand .card.selected')] as HTMLElement[];
      const ids = selected.map(el => el.dataset.cardId!).filter(Boolean);
      const selEl = document.getElementById('add-meld-target') as HTMLSelectElement | null;
      const meldIdx = selEl ? parseInt(selEl.value, 10) : NaN;
      if (!isNaN(meldIdx) && ids.length) {
        game.addToExistingMeld(0, meldIdx, ids);
      }
    });

    document.getElementById('btn-discard-buy-yes').addEventListener('click', () => {
      hideDiscardBuyOverlay();
      if (game.discardBuyerPromptIndex >= 0) {
        const ok = game.buyDiscard(game.discardBuyerPromptIndex);
        if (ok) {
          showToast(`${game.players[game.discardBuyerPromptIndex].name} bought the discard.`);
        } else {
          game.advanceBuyDiscardPrompt();
        }
      }
    });

    document.getElementById('btn-discard-buy-no').addEventListener('click', () => {
      hideDiscardBuyOverlay();
      game.advanceBuyDiscardPrompt();
    });

    document.getElementById('btn-play-again').addEventListener('click', () => {
      hideGameOver();
      game.reset();
      renderBoard(game);
      setTimeout(() => showNewGameOverlay(), 200);
    });

    let activeSortBtn: HTMLElement | null = null;

    function clearSortButtons(): void {
      document.querySelectorAll('#sort-controls .btn-sort-active').forEach(el => el.classList.remove('btn-sort-active'));
      activeSortBtn = null;
    }

    document.getElementById('btn-sort-suit').addEventListener('click', () => {
      document.querySelectorAll('#human-hand .card.selected').forEach(el => el.classList.remove('selected'));
      clearSortButtons();
      if (currentSortMode === 'suit') {
        currentSortMode = null;
        document.getElementById('sort-controls')?.classList.remove('active-sort');
        return;
      }
      activeSortBtn = document.getElementById('btn-sort-suit') as HTMLElement;
      currentSortMode = 'suit';
      document.getElementById('sort-controls')?.classList.add('active-sort');
      activeSortBtn.classList.add('btn-sort-active');
      renderBoard(game);
    });

    document.getElementById('btn-sort-rank').addEventListener('click', () => {
      document.querySelectorAll('#human-hand .card.selected').forEach(el => el.classList.remove('selected'));
      clearSortButtons();
      if (currentSortMode === 'rank') {
        currentSortMode = null;
        document.getElementById('sort-controls')?.classList.remove('active-sort');
        return;
      }
      activeSortBtn = document.getElementById('btn-sort-rank') as HTMLElement;
      currentSortMode = 'rank';
      document.getElementById('sort-controls')?.classList.add('active-sort');
      activeSortBtn.classList.add('btn-sort-active');
      renderBoard(game);
    });

    function showDiscardBuyOverlay(): void {
      const overlay = document.getElementById('discard-buy-overlay');
      if (!overlay) return;
      const promptIdx = game.discardBuyerPromptIndex;
      if (promptIdx < 0 || promptIdx >= game.players.length) return;
      const player = game.players[promptIdx];

      if (!player.isHuman) {
        setTimeout(() => {
          if (game.state !== 'buyDiscard' || game.discardBuyerPromptIndex !== promptIdx) return;
          const wants = game.aiWantsDiscard(promptIdx);
          if (wants && player.chips > 0) {
            game.buyDiscard(promptIdx);
            showToast(`${player.name} bought the discard.`);
          } else {
            game.advanceBuyDiscardPrompt();
          }
        }, 600);
        return;
      }

      const cardDisplay = document.getElementById('discard-buy-card-display');
      if (cardDisplay && game.discardPile.length > 0) {
        const topId = game.discardPile[game.discardPile.length - 1];
        const card = game.getCard(topId);
        if (card) {
          cardDisplay.innerHTML = '';
          const el = cardElement(topId, game.allCards, false);
          if (el) cardDisplay.appendChild(el);
        }
      }

      overlay.style.display = 'flex';
      showToast(`${player.name}'s turn to decide.`);
    }

    function hideDiscardBuyOverlay(): void {
      const overlay = document.getElementById('discard-buy-overlay');
      if (overlay) overlay.style.display = 'none';
    }

    function onStateChanged(event?: StateEvent): void {
      renderBoard(game);

      if (game._lastAction) {
        pushActionLogEntry(game._lastAction);
        game._lastAction = null;
      }

      if (game.state === 'dealover') {
        setTimeout(() => {
          if (game.state !== 'dealover') return;
          game.advanceDeal();
          renderBoard(game);
        }, 1500);
      } else if (game.state === 'gameover') {
        hideGameOver();
        setTimeout(() => renderGameOver(), 100);
      } else if (game.state === 'buyDiscard') {
        showDiscardBuyOverlay();
      } else if (game.isCurrentPlayerAI() && (game.state === 'draw' || game.state === 'meld')) {
        const cpIdx = game.currentPlayerIndex;
        setTimeout(() => {
          if (!game.isCurrentPlayerAI()) return;
          if (game.state !== 'draw' && game.state !== 'meld') return;
          game.aiPlayTurn(cpIdx);
          game.publish('stateChanged');
        }, 800);
      }
    }

    game.messagesOut.onStateChanged = onStateChanged;
  }

  function onNewGameConfirm(): void {
    const input = document.getElementById('player-name-input') as HTMLInputElement | null;
    const name = (input ? input.value : '') || 'Player 1';
    if (!game) return;

    game.playerName = name.trim() || 'Player 1';
    game.players[0].name = game.playerName;

    const allPlayers = game.players.map(p => p.name).join(', ');
    pushActionLogEntry(new ActionLogEntry('Telefunken — Peru v1', 0, 'New Game', `Players: ${allPlayers}`));

    const overlay = document.getElementById('new-game-overlay');
    if (overlay) overlay.style.display = 'none';
    renderBoard(game);
    setTimeout(() => {
      game.startGame();
    }, 300);
  }

  function onGameReady(): void {
    const btn = document.getElementById('btn-confirm-new-game');
    if (btn) {
      btn.addEventListener('click', onNewGameConfirm);
    }
    const input = document.getElementById('player-name-input') as HTMLInputElement | null;
    if (input) {
      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') onNewGameConfirm();
      });
    }

    const defaultName = (input?.value?.trim()) || 'Player 1';
    game = new Game(defaultName);
    initUI(game);
  }

  if (document.readyState !== 'loading') onGameReady();
  else document.addEventListener('DOMContentLoaded', onGameReady);

}
