import { Card, Deck, Meld, Player, Game, sortByRank, sortBySuit, ActionLogEntry, ActivityLog } from './game/index.js';
import type { Suit, CardRank, MeldType, GameState, Contract, StateEvent } from './game/index.js';
import type { MessagesOut } from './game/types.js';
import type { ActionEventType } from './game/activity-log/log-manager.js';
import { CONTRACTS } from './game/index.js';

type CardMap = Record<string, Card>;
type Label = Record<string | CardRank, string>;

if (typeof window !== 'undefined') {
  const suitSymbol: Record<Suit, string> = {
    hearts: '\u2665',
    diamonds: '\u2666',
    clubs: '\u2663',
    spades: '\u2660',
    joker: String.fromCodePoint(0x1F0CF),
  };
  const rankLabel: Label = {
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '10': '10',
    11: 'J',
    12: 'Q',
    13: 'K',
    14: 'A',
    joker: '',
  };

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
    }, duration ?? 2400);
  }

  let discardMode = false;
  let currentSortMode: null | 'suit' | 'rank' = null;

  let actionLogEntries: ActionLogEntry[] = [];
  const MAX_LOG_ENTRIES = 200;

  function getActionCardClass(entry: ActionLogEntry): string {
    if (entry.action.includes('New Game')) return ActivityLog.getActionCardClass('NewGame');
    if (entry.action === 'Game Over') return ActivityLog.getActionCardClass('GameOver');
    if (entry.action.includes('Started Turn')) return ActivityLog.getActionCardClass('DrawStock');
    if (entry.action.includes('Played Set')) return ActivityLog.getActionCardClass('PlayMeldSet');
    if (entry.action.includes('Played Run')) return ActivityLog.getActionCardClass('PlayMeldRun');
    if (entry.action === 'Add to Meld') return ActivityLog.getActionCardClass('AddToMeld');
    if (entry.action === 'Bought Card') return ActivityLog.getActionCardClass('BuyDiscard');
    if (entry.action === 'Discarded') return ActivityLog.getActionCardClass('Discard');
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
      detailEl.textContent = entry.detail ?? entry.action;

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

  function cardElement(cardId: string, allCards: CardMap, selectable: boolean): HTMLElement | null {
    const card = allCards[cardId];
    if (!card) return null;
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.cardId = cardId;

    if (card.isJoker) {
      el.classList.add('card-joker');
      el.textContent = 'JOKER';
    } else {
      const isRed: boolean = card.suit === 'hearts' || card.suit === 'diamonds';
      const colorClass: string = isRed ? 'card-red' : 'card-dark-on-white';
      el.classList.add(colorClass);
      el.innerHTML = `<span>${rankLabel[String(card.rank)]}</span><span style="font-size:1.3rem">${suitSymbol[card.suit]}</span>`;
    }

    if (selectable) {
      el.addEventListener('click', () => {
        if (discardMode && game?.state === 'discard' && game.currentPlayerIndex === 0) {
          const clickedId: string | undefined = el.dataset.cardId;
          if (!clickedId) return;
          const ok: boolean = game.discardCard(0, clickedId);
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
    const contract: Contract | null = CONTRACTS[g.dealNumber - 1] ?? null;

    const dealLabel: HTMLSpanElement | null = document.getElementById('deal-label');
    if (dealLabel) dealLabel.textContent = `Deal #${g.dealNumber}`;

    const contractLabel: HTMLSpanElement | null = document.getElementById('contract-label');
    if (contractLabel) {
      contractLabel.textContent = contract
        ? `Contract: ${contract.count}\u00D7${contract.minSize}`
        : 'Game Over';
    }

    const scoreboardBody: HTMLElement | null = document.getElementById('scoreboard-body');
    if (!scoreboardBody) return;
    
    for (const p of g.players) {
      const tr = document.createElement('tr');
      const dealerIdx = g.getDealerIndex(g.dealNumber);
      const isActive = g.currentPlayerIndex === p.id;
      const isDealer = dealerIdx === p.id;
      let displayName: string;
      if (isActive && isDealer) {
        displayName = '\u25BA [D] ' + p.name;
      } else if (isActive) {
        displayName = '\u25BA ' + p.name;
      } else if (isDealer) {
        displayName = '[D] ' + p.name;
      } else {
        displayName = p.name;
      }
      const cellValues: string[] = [
        displayName,
        p.isHuman ? String(p.handCardCount) : '?',
        String(p.chips),
        String(p.score),
        (p.hand.length === 0 && g.state === 'dealover')
          ? 'OUT'
          : '',
      ];
      for (const txt of cellValues) {
        const td = document.createElement('td');
        td.textContent = txt;
        tr.appendChild(td);
      }
      scoreboardBody.appendChild(tr);
    }

    const mc: HTMLElement | null = document.getElementById('melds-container');
    if (mc) {
      mc.innerHTML = '';
      for (const meld of g.tableMelds) {
        const group = document.createElement('div');
        group.className = 'meld-group';
        const label = document.createElement('div');
        label.className = 'meld-owner-label';
        label.textContent = `${g.players[meld.owner].name}'s ${meld.type}${meld.isContract ? ' (contract)' : ''}`;
        group.appendChild(label);
        const cardsRow = document.createElement('div');
        cardsRow.style.display = 'flex';
        cardsRow.style.gap = '4px';
        for (const c of meld.cards) {
          const cardEl: HTMLElement | null = cardElement(c.id, g.allCards, false);
          if (cardEl) cardsRow.appendChild(cardEl);
        }
        group.appendChild(cardsRow);
        mc.appendChild(group);
      }
    }

    const addSel: HTMLSelectElement | null = document.getElementById('add-meld-target') as HTMLSelectElement | null;
    if (addSel) {
      addSel.innerHTML = '';
      for (let i: number = 0; i < g.tableMelds.length; i++) {
        const m: Meld = g.tableMelds[i];
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = `${g.players[m.owner].name}'s ${m.type} (${m.cards.length} cards)`;
        addSel.appendChild(opt);
      }
    }

    const stockEl: HTMLSpanElement | null = document.getElementById('stock-count');
    if (stockEl) stockEl.textContent = g.deck ? String(g.deck.remaining) : '0';

    const dtEl: HTMLSpanElement | null = document.getElementById('discard-top');
    if (dtEl) {
      dtEl.innerHTML = '';
      if (g.discardPile.length > 0) {
        const topId: string = g.discardPile[g.discardPile.length - 1];
        const card: Card | null = g.getCard(topId);
        if (card) {
          const el: HTMLElement | null = cardElement(topId, g.allCards, false);
          dtEl.appendChild(el ?? document.createElement('div'));
        }
      } else {
        dtEl.textContent = '\u2014';
      }
    }

    const humanHandEl: Element | null = document.getElementById('human-hand');
    if (humanHandEl) {
      humanHandEl.innerHTML = '';
      const players: readonly Player[] = g.players;
      const human: Player = players[0];
      const cardMap: CardMap = g.allCards;
      let cardObjs: Card[];

      if (currentSortMode === 'suit') {
        const mapped: Card[] = [];
        for (const id of human.hand) {
          const c: Card | undefined = cardMap[id];
          if (c) mapped.push(c);
        }
        cardObjs = sortBySuit(mapped);
      } else if (currentSortMode === 'rank') {
        const mapped: Card[] = [];
        for (const id of human.hand) {
          const c: Card | undefined = cardMap[id];
          if (c) mapped.push(c);
        }
        cardObjs = sortByRank(mapped);
      } else {
        const mapped: Card[] = [];
        for (const id of human.hand) {
          const c: Card | undefined = cardMap[id];
          if (c) mapped.push(c);
        }
        cardObjs = Array.from(mapped);
      }

      for (const card of cardObjs) {
        const el: HTMLElement | null = cardElement(card.id, cardMap, true);
        if (el) humanHandEl.appendChild(el);
      }
    }

    const phaseLabel: HTMLSpanElement | null = document.getElementById('phase-label');
    if (phaseLabel) phaseLabel.textContent = `Phase: ${g.state}`;

    updateControls(g);

    const lastMelds: NodeListOf<Element> = document.querySelectorAll('.meld-group:last-child');
    lastMelds.forEach((g: Element) => g.classList.add('card-enter'));
  }

  function updateControls(currentGame: Game): void {
    const human: Player = currentGame.players[0];
    const isHumanTurn: boolean = currentGame.currentPlayerIndex === 0;
    const btnBuy: HTMLButtonElement | null = document.getElementById('btn-buy') as HTMLButtonElement | null;
    const endTurnBtn: HTMLButtonElement | null = document.getElementById('btn-end-turn') as HTMLButtonElement | null;
    const meldControls: HTMLElement | null = document.getElementById('meld-controls');
    const addMeldControls: HTMLElement | null = document.getElementById('add-meld-controls');

    const enable = (el: HTMLElement | null): void => { if (el) { el.style.pointerEvents = ''; el.style.opacity = '1'; } };
    const disable = (el: HTMLElement | null): void => { if (el) { el.style.pointerEvents = 'none'; el.style.opacity = '0.4'; } };

    const state: GameState = currentGame.state;
    if (state === 'dealover' || state === 'gameover') {
      disable(meldControls);
      disable(addMeldControls);
      disable(endTurnBtn);
      if (state === 'gameover') {
        showToast('Game Over — lowest score wins!');
      } else {
        showToast('Deal complete.');
      }
    } else if (isHumanTurn && state === 'meld') {
      enable(meldControls);
      enable(endTurnBtn);
      if (human.hasMelded) enable(addMeldControls);
      else disable(addMeldControls);
    } else if (isHumanTurn && state === 'discard') {
      discardMode = true;
      enable(meldControls);
      disable(addMeldControls);
      enable(endTurnBtn);
      showToast('Click a card to discard.');
    } else if (state === 'buyDiscard') {
      disable(meldControls);
      disable(addMeldControls);
      disable(endTurnBtn);
      const promptIdx: number = currentGame.discardBuyerPromptIndex;
      if (promptIdx >= 0 && promptIdx < currentGame.players.length) {
        showToast(`${currentGame.players[promptIdx].name}'s turn to decide.`);
      }
    } else if (isHumanTurn && state === 'draw') {
      disable(meldControls);
      disable(addMeldControls);
      disable(endTurnBtn);
    } else {
      disable(meldControls);
      disable(addMeldControls);
      disable(endTurnBtn);
      if (!isHumanTurn && !currentGame.isCurrentPlayerAI()) {
        showToast(`${currentGame.players[currentGame.currentPlayerIndex].name}'s turn.`);
      } else if (currentGame.isCurrentPlayerAI()) {
        showToast(`\uD83E\uDD16 ${currentGame.players[currentGame.currentPlayerIndex].name} is thinking...`);
      }
    }

    const enableBuyBtn: boolean = !!(
      !human.hasMelded
      && human.chips > 0
      && currentGame.discardPile.length > 0
      && state !== 'dealover'
      && state !== 'gameover'
      && state !== 'buyDiscard'
      && isHumanTurn
    );
    if (enableBuyBtn) {
      enable(btnBuy);
    } else {
      disable(btnBuy);
    }
  }

   function renderGameOver(): void {
     const overlay: HTMLElement | null = document.getElementById('gameover-container');
     if (!overlay) return;

     const seedDisplayEl: HTMLElement | null = document.getElementById('seed-display');
     if (seedDisplayEl && game) {
       const currentSeed: number | null = game.seed;
       if (typeof currentSeed === 'number') {
         seedDisplayEl.innerHTML = `<strong>Seed:</strong> &nbsp; ${currentSeed}`;
         seedDisplayEl.style.textAlign = 'right';
         seedDisplayEl.style.marginInlineEnd = '2rem';
       }
     } 

     const tbody: HTMLTableSectionElement | null = document.getElementById('leaderboard-body') as HTMLTableSectionElement | null;
    if (!tbody) return;
    tbody.innerHTML = '';

    const leaderboard = game!.getLeaderboard();
    
    for (const entry of leaderboard) {
      const tr = document.createElement('tr');
      if (entry.rank === 1) tr.classList.add('rank-1');

      const rankEl: HTMLTableCellElement = _td(String(entry.rank));
      tr.appendChild(rankEl);
      
      let displayName: string;
      if (entry.isActivePlayer && entry.isDealer) {
        displayName = '\u25BA [D] ' + entry.player.name;
      } else if (entry.isActivePlayer) {
        displayName = '\u25BA ' + entry.player.name;
      } else if (entry.isDealer) {
        displayName = '[D] ' + entry.player.name;
      } else {
        displayName = entry.player.name;
      }
      const nameEl: HTMLTableCellElement = _td(displayName);
      tr.appendChild(nameEl);

      const penaltyEl: HTMLTableCellElement = _td(`${entry.penaltyScore}`);
      tr.appendChild(penaltyEl);
      
      const chipEl: HTMLTableCellElement = _td(`+${entry.chipBonus}`);
      tr.appendChild(chipEl);

      const finalScore: number = entry.penaltyScore;
      const totalEl: HTMLTableCellElement = _td(`<span>${finalScore}</span> <small style="color:var(--text-muted)"> (incl. chips)</small>`);
      totalEl.querySelector('span')!.style.fontWeight = '700';
      tr.appendChild(totalEl);

      tbody.appendChild(tr);
    }

    const winnerEntry = leaderboard[0];
    if (winnerEntry) {
      const winnerTextEl: HTMLElement | null = document.getElementById('winner-text');
      if (winnerTextEl) {
        winnerTextEl.textContent = `${winnerEntry.player.name} wins with ${winnerEntry.penaltyScore} points!`;
      }
    }

    overlay.style.display = 'flex';
    overlay.classList.add('card-enter');
  }

  function hideGameOver(): void {
    const overlay: HTMLElement | null = document.getElementById('gameover-container');
    if (overlay) overlay.style.display = 'none';
  }

  function _td(text: string): HTMLTableCellElement {
    const el: HTMLTableCellElement = document.createElement('td');
    el.textContent = text;
    return el;
  }

   function initUI(gameInstance: Game): void {
    let pendingReplaySeed: string | undefined;
    function showNewGameOverlay(seed?: string): void {
      const overlay: HTMLElement | null = document.getElementById('new-game-overlay');
      if (!overlay) return;
      const input: HTMLInputElement | null = document.getElementById('player-name-input') as HTMLInputElement | null;
      if (input) input.value = gameInstance.playerName || 'Player 1';
      const seedInput: HTMLInputElement | null = document.getElementById('player-seed-input') as HTMLInputElement | null;
      if (seedInput) {
        seedInput.value = seed?.trim() ? seed.trim() : '';
      }
      overlay.style.display = 'flex';
    }

    showNewGameOverlay();

    const logPanel: HTMLElement | null = document.getElementById('activity-log');
    if (logPanel) {
      logPanel.classList.remove('collapsed');
    }

    const btnToggleLogElement: HTMLButtonElement | null = document.getElementById('btn-toggle-log') as HTMLButtonElement | null;
    if (btnToggleLogElement) {
      btnToggleLogElement.addEventListener('click', () => {
        if (!logPanel) return;
        logPanel.classList.toggle('collapsed');
      });
    }

    const btnBuy: HTMLButtonElement | null = document.getElementById('btn-buy') as HTMLButtonElement | null;
    if (btnBuy) {
      btnBuy.addEventListener('click', () => {
        gameInstance.buyDiscard(0);
      });
    }

    const btnEndTurn: HTMLButtonElement | null = document.getElementById('btn-end-turn') as HTMLButtonElement | null;
    if (btnEndTurn) {
      btnEndTurn.addEventListener('click', () => {
        gameInstance.endTurn(0);
      });
    }

    const btnConfirmSet: HTMLButtonElement | null = document.getElementById('btn-confirm-set') as HTMLButtonElement | null;
    if (btnConfirmSet) {
      btnConfirmSet.addEventListener('click', () => {
        const selected: HTMLElement[] = [...document.querySelectorAll('#human-hand .card.selected')] as HTMLElement[];
        const ids: string[] = [];
        for (const el of selected) {
          const cardId: string | undefined = el.dataset.cardId;
          if (cardId) ids.push(cardId);
        }
        if (ids.length > 0) {
          const ok: boolean = gameInstance.playMeld(0, ids, 'set');
          if (!ok) showToast('Invalid set — check eligibility.');
        }
      });
    }

    const btnConfirmRun: HTMLButtonElement | null = document.getElementById('btn-confirm-run') as HTMLButtonElement | null;
    if (btnConfirmRun) {
      btnConfirmRun.addEventListener('click', () => {
        const selected: HTMLElement[] = [...document.querySelectorAll('#human-hand .card.selected')] as HTMLElement[];
        const ids: string[] = [];
        for (const el of selected) {
          const cardId: string | undefined = el.dataset.cardId;
          if (cardId) ids.push(cardId);
        }
        if (ids.length > 0) {
          const ok: boolean = gameInstance.playMeld(0, ids, 'run');
          if (!ok) showToast('Invalid run — check eligibility.');
        }
      });
    }

    const btnAddMeldToggle: HTMLButtonElement | null = document.getElementById('btn-add-meld-toggle') as HTMLButtonElement | null;
    if (btnAddMeldToggle) {
      btnAddMeldToggle.addEventListener('click', () => {
        const optDiv: HTMLElement | null = document.getElementById('add-meld-options');
        if (!optDiv) return;
        optDiv.style.display = optDiv.style.display === 'none' ? 'block' : 'none';
      });
    }

    const btnConfirmAdd: HTMLButtonElement | null = document.getElementById('btn-confirm-add') as HTMLButtonElement | null;
    if (btnConfirmAdd) {
      btnConfirmAdd.addEventListener('click', () => {
        const selected: HTMLElement[] = [...document.querySelectorAll('#human-hand .card.selected')] as HTMLElement[];
        const ids: string[] = [];
        for (const el of selected) {
          const cardId: string | undefined = el.dataset.cardId;
          if (cardId) ids.push(cardId);
        }
        const selEl: HTMLSelectElement | null = document.getElementById('add-meld-target') as HTMLSelectElement | null;
        const meldIdx: number = selEl ? parseInt(selEl.value, 10) : NaN;
        if (!isNaN(meldIdx) && ids.length > 0) {
          gameInstance.addToExistingMeld(0, meldIdx, ids);
        }
      });
    }

    const btnDiscardBuyYes: HTMLButtonElement | null = document.getElementById('btn-discard-buy-yes') as HTMLButtonElement | null;
    if (btnDiscardBuyYes) {
      btnDiscardBuyYes.addEventListener('click', () => {
        hideDiscardBuyOverlay();
        if (gameInstance.discardBuyerPromptIndex >= 0) {
          const promptIdx: number = gameInstance.discardBuyerPromptIndex;
          const ok: boolean = gameInstance.buyDiscard(promptIdx);
          if (ok) {
            showToast(`${gameInstance.players[promptIdx].name} bought the discard.`);
          } else {
            gameInstance.advanceBuyDiscardPrompt();
          }
        }
      });
    }

    const btnDiscardBuyNo: HTMLButtonElement | null = document.getElementById('btn-discard-buy-no') as HTMLButtonElement | null;
    if (btnDiscardBuyNo) {
      btnDiscardBuyNo.addEventListener('click', () => {
        hideDiscardBuyOverlay();
        gameInstance.advanceBuyDiscardPrompt();
      });
    }

     const btnPlayAgain: HTMLButtonElement | null = document.getElementById('btn-play-again') as HTMLButtonElement | null;
     if (btnPlayAgain) {
       btnPlayAgain.addEventListener('click', () => {
         hideGameOver();
         gameInstance.reset();
         renderBoard(gameInstance);
         const replaySeedEl: HTMLInputElement | null = document.getElementById('replay-seed-input') as HTMLInputElement | null;
         const seedValue = replaySeedEl?.value ?? '';
         setTimeout(() => showNewGameOverlay(seedValue || undefined), 200);
       });
     }

    let activeSortBtn: HTMLElement | null = null;

    function clearSortButtons(): void {
      const items: NodeListOf<HTMLElement> = document.querySelectorAll('#sort-controls .btn-sort-active');
      for (const el of items) el.classList.remove('btn-sort-active');
      activeSortBtn = null;
    }

    const btnSortSuit: HTMLButtonElement | null = document.getElementById('btn-sort-suit') as HTMLButtonElement | null;
    if (btnSortSuit) {
      btnSortSuit.addEventListener('click', () => {
        const preSelected: NodeListOf<HTMLElement> = document.querySelectorAll('#human-hand .card.selected');
        for (const el of preSelected) el.classList.remove('selected');

        clearSortButtons();
        
        if (currentSortMode === 'suit') {
          currentSortMode = null;
          const sortControls: HTMLElement | null = document.getElementById('sort-controls');
          if (sortControls) sortControls.classList.remove('active-sort');
          return;
        }

        const btnEl: HTMLButtonElement | null = document.getElementById('btn-sort-suit') as HTMLButtonElement | null;
        activeSortBtn = btnEl || null;
        currentSortMode = 'suit';
        const sortControls: HTMLElement | null = document.getElementById('sort-controls');
        if (sortControls) sortControls.classList.add('active-sort');
        if (activeSortBtn) activeSortBtn.classList.add('btn-sort-active');
        renderBoard(gameInstance);
      });
    }

    const btnSortRank: HTMLButtonElement | null = document.getElementById('btn-sort-rank') as HTMLButtonElement | null;
    if (btnSortRank) {
      btnSortRank.addEventListener('click', () => {
        const preSelected: NodeListOf<HTMLElement> = document.querySelectorAll('#human-hand .card.selected');
        for (const el of preSelected) el.classList.remove('selected');

        clearSortButtons();
        
        if (currentSortMode === 'rank') {
          currentSortMode = null;
          const sortControls: HTMLElement | null = document.getElementById('sort-controls');
          if (sortControls) sortControls.classList.remove('active-sort');
          return;
        }

        const btnEl: HTMLButtonElement | null = document.getElementById('btn-sort-rank') as HTMLButtonElement | null;
        activeSortBtn = btnEl || null;
        currentSortMode = 'rank';
        const sortControls: HTMLElement | null = document.getElementById('sort-controls');
        if (sortControls) sortControls.classList.add('active-sort');
        if (activeSortBtn) activeSortBtn.classList.add('btn-sort-active');
        renderBoard(gameInstance);
      });
    }

    function showDiscardBuyOverlay(): void {
      const overlay: HTMLElement | null = document.getElementById('discard-buy-overlay');
      if (!overlay) return;
      const promptIdx: number = gameInstance.discardBuyerPromptIndex;
      if (promptIdx < 0 || promptIdx >= gameInstance.players.length) return;
      const player: Player = gameInstance.players[promptIdx];

      if (!player.isHuman) {
        setTimeout(() => {
          if (gameInstance.state !== 'buyDiscard' || gameInstance.discardBuyerPromptIndex !== promptIdx) return;
          const wants: boolean = gameInstance.aiWantsDiscard(promptIdx);
          if (wants && player.chips > 0) {
            gameInstance.buyDiscard(promptIdx);
            showToast(`${player.name} bought the discard.`);
          } else {
            gameInstance.advanceBuyDiscardPrompt();
          }
        }, 600);
        return;
      }

      const cardDisplay: HTMLElement | null = document.getElementById('discard-buy-card-display');
      if (cardDisplay && gameInstance.discardPile.length > 0) {
        const topId: string = gameInstance.discardPile[gameInstance.discardPile.length - 1];
        const card: Card | null = gameInstance.getCard(topId);
        if (card) {
          cardDisplay.innerHTML = '';
          const el: HTMLElement | null = cardElement(topId, gameInstance.allCards, false);
          if (el) cardDisplay.appendChild(el);
        }
      }

      overlay.style.display = 'flex';
      showToast(`${player.name}'s turn to decide.`);
    }

    function hideDiscardBuyOverlay(): void {
      const overlay: HTMLElement | null = document.getElementById('discard-buy-overlay');
      if (overlay) overlay.style.display = 'none';
    }

    function onStateChanged(event?: StateEvent): void {
      renderBoard(gameInstance);

      const currentEntries: readonly ActionLogEntry[] = gameInstance.activityLog.entries;
      const newEntries: readonly ActionLogEntry[] = currentEntries.slice(actionLogEntries.length);
      for (const entry of newEntries) {
        actionLogEntries.push(entry);
        if (actionLogEntries.length > MAX_LOG_ENTRIES) {
          actionLogEntries.shift();
        }
      }
      renderActivityLog();

      const currentState: GameState = gameInstance.state;
      if (currentState === 'dealover') {
        setTimeout(() => {
          if (gameInstance.state !== 'dealover') return;
          gameInstance.advanceDeal();
          renderBoard(gameInstance);
        }, 1500);
      } else if (currentState === 'gameover') {
        hideGameOver();
        setTimeout(() => renderGameOver(), 100);
      } else if (currentState === 'buyDiscard') {
        showDiscardBuyOverlay();
      } else if (gameInstance.isCurrentPlayerAI() && (currentState === 'draw' || currentState === 'meld')) {
        const cpIdx: number = gameInstance.currentPlayerIndex;
        setTimeout(() => {
          if (!gameInstance.isCurrentPlayerAI()) return;
          if (gameInstance.state !== 'draw' && gameInstance.state !== 'meld') return;
          gameInstance.aiPlayTurn(cpIdx);
          gameInstance.publish('stateChanged');
        }, 800);
      }
    }

    const messages: MessagesOut = { ...gameInstance.messagesOut };
    if (messages.onStateChanged) {
      messages.onStateChanged = onStateChanged;
      gameInstance.messagesOut = messages;
    } else {
      gameInstance.messagesOut = { onStateChanged, onMessage: undefined };
    }
  }

   function onNewGameConfirm(): void {
     const nameInput: HTMLInputElement | null = document.getElementById('player-name-input') as HTMLInputElement | null;
     const seedInput: HTMLInputElement | null = document.getElementById('player-seed-input') as HTMLInputElement | null;
     const name: string = (nameInput ? nameInput.value : '') || 'Player 1';
     const rawSeed: string = seedInput?.value ?? '';
     
     let parsedSeed: string | number | null = null;
     if (rawSeed.trim()) {
       const n = parseInt(rawSeed.trim(), 10);
       if (!isNaN(n)) {
         parsedSeed = Math.abs(Math.floor(n));
       }
     }

     const prevGame: Game | null = game;
     let overlayEl: HTMLElement | null | undefined;
     
     if (parsedSeed !== null) {
       game = new Game(name.trim() || 'Player 1', parsedSeed);
     } else {
       game = new Game(name.trim() || 'Player 1');
     }

     const currentGame: Game = game;
     
     if (prevGame) {
       const allPlayers: string = game.players.map((p: Player): string => p.name).join(', ');
       pushActionLogEntry(new ActionLogEntry('Telefunken — Peru v1', 0, 'New Game', `Players: ${allPlayers}`));
     }

    overlayEl = document.getElementById('new-game-overlay');
     if (overlayEl) overlayEl.style.display = 'none';
     
     renderBoard(game);
     
     initUI(game);
     
     setTimeout(() => {
       currentGame.startGame();
     }, 300);
   }

  function onGameReady(): void {
    const btn: HTMLButtonElement | null = document.getElementById('btn-confirm-new-game') as HTMLButtonElement | null;
    if (btn) {
      btn.addEventListener('click', onNewGameConfirm);
    }
    
    const input: HTMLInputElement | null = document.getElementById('player-name-input') as HTMLInputElement | null;
    if (input) {
      input.addEventListener('keydown', (e: KeyboardEvent): void => {
        if (e.key === 'Enter') onNewGameConfirm();
      });
    }

    const defaultName: string = (input?.value?.trim()) || 'Player 1';
    game = new Game(defaultName);
    initUI(game);
  }

  if (document.readyState !== 'loading') onGameReady();
  else document.addEventListener('DOMContentLoaded', onGameReady);

}
