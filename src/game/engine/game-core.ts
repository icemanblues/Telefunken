import type { Suit, CardRank, MeldType, GameState, Contract, StateEvent, MessagesOut } from '../types.js';
import { Card } from '../card.js';
import { Deck } from '../deck.js';
import { Meld } from '../meld.js';
import { isValidSet, isValidRun } from '../validators.js';
import { ActionLogEntry } from '../activity-log/entry.js';
import { ActivityLog } from '../activity-log/log-manager.js';
import type { ActionEventType } from '../activity-log/log-manager.js';
import { Player } from '../players/player.js';
import { CONTRACTS } from '../contracts.js';
import * as ai from './ai.js';
import * as scoreboard from './scoreboard.js';
import { createRng, parseSeed } from '../utils.js';

export class Game {
  playerName: string;
  private readonly _seed: number | null;
  players: Player[];
  deck: Deck | null = null;
  discardPile: string[] = [];
  tableMelds: Meld[] = [];
  dealNumber: number = 1;
  currentPlayerIndex: number = 0;
  state: GameState = 'init';
  allCards: Record<string, Card> = {};
  discardBuyerPromptIndex: number = -1;
  messagesOut: MessagesOut = {
    onStateChanged: () => {},
    onMessage: undefined,
    delay: typeof setTimeout !== 'undefined' ? () => {} : undefined,
  };
  activityLog: ActivityLog = new ActivityLog();
  
  // Keep _lastAction for backward compatibility - maps to last entry in activityLog
  _lastAction: ActionLogEntry | null = null;

  constructor(playerName?: string, seed?: string | number | null) {
    this.playerName = playerName || 'Player 1';
    const parsed = parseSeed(seed);
    this._seed = parsed ?? Math.floor(Math.random() * 4294967296);
    this.players = [new Player(0, this.playerName), new Player(1), new Player(2), new Player(3)];
  }

  get seed(): number {
    return this._seed!;
  }

  logAction(eventType: ActionEventType, player: string, detail: string): void {
    const entry = this.activityLog.push(eventType, player, this.dealNumber, detail);
    this._lastAction = entry;
  }

  reset(newName?: string): void {
    if (newName !== undefined) this.playerName = newName;
    this.players.forEach(p => {
      p.chips = 6;
      p.score = 0;
      p.hasMelded = false;
      p.hand = [];
    });
    if (this.players[0]) this.players[0].name = this.playerName;
    this.dealNumber = 1;
    this.currentPlayerIndex = 0;
    this.state = 'init';
    this.tableMelds = [];
    this.allCards = {};
    this.discardBuyerPromptIndex = -1;
    this.activityLog.clear();
    this._lastAction = null;
  }

  /** Cached dealer offset derived from seed at game construction. */
  private _cachedDealerOffset: number | null = null;

  /** Lazily compute (and cache) the first-dealer offset from the seed. */
  private getDealerOffset(): number {
    if (this._cachedDealerOffset === null) {
      const rng = createRng(this._seed!);
      this._cachedDealerOffset = Math.floor(rng() * 4);
    }
    return this._cachedDealerOffset;
  }

  /** Get the dealer player index for a given deal number. */
  getDealerIndex(dealNum: number): number {
    return (dealNum - 1 + this.getDealerOffset()) % 4;
  }

  startGame(): void {
    this.reset();
    if (this.dealNumber <= 6) {
      this.startDeal();
    }
  }

  getAllCards(): Record<string, Card> {
    return this.allCards;
  }

  getCard(id: string): Card | null {
    return this.allCards[id] || null;
  }

  startDeal(): void {
    if (this.dealNumber > 6) {
      this.endGame();
      return;
    }
    this.players.forEach(p => {
      p.hand = [];
      p.hasMelded = false;
    });
    this.tableMelds = [];
    this.discardPile = [];
    const rng = createRng((this._seed! + this.dealNumber) | 0);
    this.deck = new Deck(rng);
    this.deck.shuffle();
    this.allCards = {};
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 11; j++) {
        const card = this.deck.draw();
        if (card) {
          this.players[i].hand.push(card.id);
          this.allCards[card.id] = card;
        }
      }
    }
    this.currentPlayerIndex = this.getDealerIndex(this.dealNumber);
    const dealerCard = this.deck.draw();
    if (dealerCard) {
      this.players[this.currentPlayerIndex].hand.push(dealerCard.id);
      this.allCards[dealerCard.id] = dealerCard;
    }
    this.state = 'discard';
    this.publish('dealStarted');
  }

  drawFromStock(playerId: number): boolean {
    if (this.state !== 'draw') return false;
    const player = this.players[playerId];
    const card = this.deck?.draw();
    if (!card) {
      this.forceEndDeal();
      return false;
    }
    player.hand.push(card.id);
    this.allCards[card.id] = card;
    this.state = 'meld';
    this.logAction('DrawStock', player.name, 'drew a card from stock');
    this.publish('stateChanged');
    return true;
  }

  buyDiscard(playerId: number): boolean {
    const player = this.players[playerId];
    if (!player || player.hasMelded || player.chips <= 0) return false;
    if (this.discardPile.length === 0) return false;
    player.chips -= 1;
    const topCard = this.discardPile.pop();
    if (!topCard) return false;
    player.hand.push(topCard);
    const isOwnTurn = (playerId === this.currentPlayerIndex && this.state === 'draw');
    const extraDraws = isOwnTurn ? 2 : 1;
    for (let i = 0; i < extraDraws; i++) {
      const card = this.deck?.draw();
      if (!card) break;
      player.hand.push(card.id);
      this.allCards[card.id] = card;
    }
    if (isOwnTurn) {
      this.state = 'meld';
    }
    if (this.state === 'buyDiscard') {
      this.state = 'meld';
    }
    this.logAction('BuyDiscard', player.name, `bought a card and drew ${extraDraws}${extraDraws > 1 ? ' extra' : ''} cards`);
    this.publish('stateChanged');
    return true;
  }

  playMeld(playerId: number, cardIds: string[], type: MeldType): boolean {
    if (this.state === 'discard' || this.state === 'dealover' || this.state === 'gameover') return false;
    const player = this.players[playerId];
    if (!player) return false;

    const cards = cardIds.map(id => this.allCards[id]).filter(Boolean) as Card[];
    if (cards.length !== cardIds.length || !cards.length) return false;

    for (const id of cardIds) {
      if (!player.hand.includes(id)) return false;
    }

    let valid = false;
    if (type === 'set') {
      valid = isValidSet(cards);
    } else if (type === 'run') {
      const naturals = cards.filter(c => !c.isJoker) as Card[];
      const wilds = cards.filter(c => c.isJoker) as Card[];
      valid = isValidRun(naturals, wilds);
    }

    if (!valid) return false;

    if (!player.hasMelded) {
      const contract = CONTRACTS[this.dealNumber - 1];
      if (type === 'run') return false;
      if (cards.length < contract.minSize) return false;
    }

    if (player.hand.length <= cards.length) return false;

    const meld = new Meld(type, playerId, cards);
    if (!player.hasMelded) {
      meld.isContract = true;
    }
    this.tableMelds.push(meld);
    player.hand = player.hand.filter(id => !cardIds.includes(id));
    player.hasMelded = true;

    const logEvent: ActionEventType = type === 'set' ? 'PlayMeldSet' : 'PlayMeldRun';
    this.logAction(logEvent, player.name, `${cardIds.length} card${cardIds.length > 1 ? 's' : ''}`);
    this.publish('stateChanged');
    return true;
  }

  addToExistingMeld(playerId: number, meldIndex: number, cardIds: string[]): boolean {
    if (this.state === 'discard' || this.state === 'dealover' || this.state === 'gameover') return false;
    const meld = this.tableMelds[meldIndex];
    if (!meld) return false;
    const player = this.players[playerId];
    if (!player || !player.hasMelded) return false;

    const cards = cardIds.map(id => this.allCards[id]).filter(Boolean) as Card[];
    if (cards.length !== cardIds.length || !cards.length) return false;

    for (const id of cardIds) {
      if (!player.hand.includes(id)) return false;
    }

    let canAddAll = true;
    if (meld.type === 'set') {
      const meldNaturals = meld.cards.filter(c => !c.isJoker) as Card[];
      for (const c of cards) {
        if (c.isJoker || typeof c.rank !== 'number' || c.rank !== meldNaturals[0].rank) {
          canAddAll = false;
          break;
        }
      }
    } else if (meld.type === 'run') {
      const existingNaturals = meld.cards.filter(c => !c.isJoker) as Card[];
      if (!existingNaturals.length) return false;
      for (const c of cards) {
        if (!c.isJoker && c.suit !== existingNaturals[0].suit) {
          canAddAll = false;
          break;
        }
      }
      const newNaturals = [...existingNaturals, ...cards.filter(c => !c.isJoker)] as Card[];
      const newWilds = [...meld.cards.filter(c => c.isJoker), ...cards.filter(c => c.isJoker)] as Card[];
      if (!isValidRun(newNaturals, newWilds)) canAddAll = false;
    }

    if (!canAddAll) return false;

    if (player.hand.length <= cards.length) {
      return false;
    }

    for (const c of cards) {
      meld.add(c);
      player.hand = player.hand.filter(id => id !== c.id);
    }

    this.logAction('AddToMeld', player.name, `${cardIds.length} card${cardIds.length > 1 ? 's' : ''}`);
    this.publish('stateChanged');
    return true;
  }

  discardCard(playerId: number, cardId: string): boolean {
    if (this.state !== 'discard') return false;
    const player = this.players[playerId];
    if (!player || !player.hand.includes(cardId)) return false;

    player.hand = player.hand.filter(id => id !== cardId);
    this.discardPile.push(cardId);

    if (player.hand.length === 0) {
      this.state = 'dealover';
      this.scoreDeal();
      const discardedCard = this.allCards[cardId];
      this.logAction('WentOut', player.name, `${discardedCard ? discardedCard.rank + ' of ' + discardedCard.suit : cardId} — went out!`);
      this.publish('stateChanged');
      return true;
    }

    const prevIndex = (this.currentPlayerIndex - 1 + 4) % 4;
    let isInitialDealDiscard = (this.discardBuyerPromptIndex < 0);

    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;

    if (isInitialDealDiscard) {
      this.state = 'draw';
    } else {
      const newPromptIndex = (this.currentPlayerIndex) % 4;
      if (newPromptIndex === prevIndex) {
        this.discardBuyerPromptIndex = -1;
        this.state = 'draw';
      } else {
        this.discardBuyerPromptIndex = newPromptIndex;
        this.state = 'buyDiscard';
      }
    }
    const discardedCard = this.allCards[cardId];
    this.logAction('Discard', player.name, `${discardedCard ? discardedCard.rank + ' of ' + discardedCard.suit : cardId} (${player.hand.length} cards remaining)`);
    this.publish('stateChanged');
    return true;
  }

  confirmDiscard(playerId: number): boolean {
    const player = this.players[playerId];
    if (!player || !player.hand.length) return false;
    if (this.state !== 'meld') return false;
    this.state = 'discard';
    this.publish('stateChanged');
    return true;
  }

  checkContractSatisfaction(playerId: number): boolean {
    const player = this.players[playerId];
    if (!player.hasMelded) return false;
    const contract = CONTRACTS[this.dealNumber - 1];
    const playerSets = this.tableMelds.filter(m => m.owner === playerId && m.type === 'set');
    let setSizeCount = 0;
    for (const m of playerSets) {
      if (m.cards.length >= contract.minSize) setSizeCount++;
    }
    return setSizeCount >= contract.count;
  }

  scoreDeal(): void {
    scoreboard.scoreDeal(this.players, this.allCards);
    this.state = 'dealover';
    this.publish('stateChanged');
  }

  endGame(): void {
    const winnerName = scoreboard.endGame(this.players);
    this.state = 'gameover';
    const leaderboard = scoreboard.getLeaderboard(this.players);
    this.logAction('GameOver', 'Telefunken — Peru v1', `${winnerName} wins! Final standings: ${leaderboard.map(e => `${e.rank}. ${e.player.name}`).join(', ')}`);
    this.publish('stateChanged');
  }

  getNextPlayerIndex(): number {
    return this.currentPlayerIndex;
  }

  advanceDeal(): void {
    this.dealNumber++;
    if (this.dealNumber > 6) {
      this.endGame();
    } else {
      this.startDeal();
    }
  }

  isCurrentPlayerAI(): boolean {
    const p = this.players[this.currentPlayerIndex];
    return p && !p.isHuman;
  }

  endTurn(_playerId: number): boolean {
    if (this.state !== 'meld') return false;
    this.state = 'discard';
    this.publish('stateChanged');
    return true;
  }

  isStockEmpty(): boolean {
    return this.deck?.remaining === 0;
  }

  forceEndDeal(): boolean {
    if (this.state === 'gameover' || this.state === 'dealover') return false;
    this.scoreDeal();
    return true;
  }

  publish(event: string | StateEvent): void {
    const stateEvent: StateEvent = typeof event === 'string'
      ? { dealNumber: this.dealNumber, phase: this.state, currentPlayerIndex: this.currentPlayerIndex }
      : (event as StateEvent);
    if (this.messagesOut.onStateChanged) {
      this.messagesOut.onStateChanged({
        dealNumber: this.dealNumber,
        phase: this.state,
        currentPlayerIndex: this.currentPlayerIndex,
        ...stateEvent,
      });
    }
  }

  // --- AI Decision Logic ---

  aiEvaluateMelds(playerId: number): Array<{ type: MeldType; cardIds: string[] }> {
    const player = this.players[playerId];
    if (!player || !player.hand.length) return [];
    
    // Keep backward compat with MeldType typing used in tests
    return ai.evaluateMelds([...player.hand], this.allCards, this.dealNumber);
  }

  forwardRankDistance(a: number, b: number): number {
    return ai.forwardRankDistance(a, b);
  }

  countWildsForRun(naturals: readonly Card[]): number {
    return ai.countWildsForRun(naturals);
  }

  isConsequencePossible(naturals: readonly Card[], maxWilds: number): boolean {
    return ai.isConsequencePossible(naturals, maxWilds);
  }

  aiDiscard(playerId: number): string | null {
    const player = this.players[playerId];
    if (!player || !player.hand.length) return null;

    const melds = this.aiEvaluateMelds(playerId);
    return ai.aiDiscardSelection([...player.hand], this.allCards, melds);
  }

  aiWantsDiscard(playerId: number): boolean {
    const player = this.players[playerId];
    if (!player || !player.hand.length) return false;
    if (this.discardPile.length === 0) return false;

    const discardTopId = this.discardPile[this.discardPile.length - 1];
    const topCard = this.allCards[discardTopId];
    if (!topCard) return false;

    const oldHand = [...player.hand];
    player.hand.push(discardTopId);
    let meldsFound: Array<{ type: MeldType; cardIds: string[] }>;
    try {
      meldsFound = this.aiEvaluateMelds(playerId);
    } finally {
      player.hand = oldHand;
    }

    if (meldsFound.length > 0) {
      let meldScore = 0;
      for (const m of meldsFound) {
        if (m.cardIds.includes(discardTopId)) {
          meldScore += m.cardIds.length;
        }
      }
      if (meldScore >= 3) return true;
    }

    return false;
  }

  aiDraw(playerId: number): boolean {
    if (this.state !== 'draw') return false;
    if (this.aiWantsDiscard(playerId)) {
      this.buyDiscard(playerId);
    } else {
      this.drawFromStock(playerId);
    }
    return true;
  }

  aiPlayTurn(playerId: number): boolean {
    const player = this.players[playerId];
    if (!player || player.isHuman) return false;

    if (this.state === 'discard' && player.hand.length > 1) {
      const cardId = this.aiDiscard(playerId);
      if (cardId) {
        return this.discardCard(playerId, cardId);
      }
      return false;
    }

    if (this.state === 'draw') {
      const drew = this.aiDraw(playerId);
      if (!drew) return false;
      return true;
    }

    if (this.state === 'meld') {
      const melds = this.aiEvaluateMelds(playerId);
      let played = false;

      if (!player.hasMelded) {
        const contract = CONTRACTS[this.dealNumber - 1];
        const validSets = melds.filter(
          m => m.type === 'set' && m.cardIds.length >= contract.minSize
        );
        for (const s of validSets) {
          if (this.playMeld(playerId, s.cardIds, 'set')) {
            played = true;
            break;
          }
        }
      }

      if (!played && this.state === 'meld') {
        for (const m of melds) {
          const allInHand = m.cardIds.every(id => player.hand.includes(id));
          if (allInHand && m.cardIds.length >= 3) {
            try {
              this.playMeld(playerId, m.cardIds, m.type);
            } catch { /* ignore */ }
          }
        }
      }

      return this.endTurn(playerId);
    }

    if (this.state === 'buyDiscard') {
      const wants = this.aiWantsDiscard(playerId);
      if (wants && player.chips > 0) {
        return this.buyDiscard(playerId);
      }
      this.advanceBuyDiscardPrompt();
      return true;
    }

    if (this.state === 'discard') {
      const cardId = this.aiDiscard(playerId);
      if (cardId) {
        return this.discardCard(playerId, cardId);
      }
      return false;
    }

    return false;
  }

  advanceBuyDiscardPrompt(): void {
    if (this.discardBuyerPromptIndex < 0) return;

    const { newIndex, allDeclined } = ai.advanceBuyDiscardPrompt(this.players, 
      ((this.discardBuyerPromptIndex - 1) + 4) % 4, 
      this.discardBuyerPromptIndex);
    
    if (allDeclined || newIndex === null) {
      this.discardBuyerPromptIndex = -1;
      this.publish('stateChanged');
    } else {
      this.discardBuyerPromptIndex = newIndex;
      this.publish('stateChanged');
    }
  }

  getLeaderboard(): Array<{ rank: number; player: Player; penaltyScore: number; chipBonus: number }> {
    return scoreboard.getLeaderboard(this.players);
  }

  getWinner(): Player | null {
    const lb = this.getLeaderboard();
    if (lb.length === 0) return null;
    return lb[0].player;
  }
}
