// Telefunken Peru v1 — Game Logic (ES Module)

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
export type CardRank = number | 'joker';
export type MeldType = 'set' | 'run';
export type GameState = 'init' | 'discard' | 'draw' | 'meld' | 'buyDiscard' | 'dealover' | 'gameover';
export interface Contract { count: number; minSize: number; }

// --- Card Class ---

export class Card {
  id: string;
  suit: Suit;
  rank: CardRank;

  constructor(id: string, suit: Suit, rank: CardRank) {
    this.id = id;
    this.suit = suit;
    this.rank = rank;
  }

  get pointValue(): number {
    if (this.suit === 'joker') return 20;
    if (typeof this.rank !== 'number') return 20; // 'joker' rank
    if (this.rank >= 3 && this.rank <= 9) return this.rank;
    if (this.rank >= 10 && this.rank <= 13) return 10;
    if (this.rank === 14) return 15;
    if (this.rank === 2) return 20;
    return 0;
  }

  get isJoker(): boolean {
    return this.suit === 'joker';
  }
}

// --- Deck Class ---

export class Deck {
  cards: Card[] = [];

  constructor() {
    let idx = 0;
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    for (let deckNum = 0; deckNum < 2; deckNum++) {
      for (const suit of suits) {
        for (let rank = 2; rank <= 14; rank++) {
          this.cards.push(new Card(`c${idx++}`, suit, rank));
        }
      }
    }
    for (let j = 0; j < 4; j++) {
      this.cards.push(new Card(`j${j}`, 'joker', 'joker'));
    }
  }

  get remaining(): number {
    return this.cards.length;
  }

  shuffle(): void {
    const arr = this.cards;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  draw(): Card | null {
    if (this.cards.length === 0) return null;
    const card = this.cards.pop();
    return card ?? null;
  }
}

// --- Pure Validators ---

export function isValidSet(cards: readonly Card[]): boolean {
  if (!Array.isArray(cards) || cards.length < 3) return false;
  for (const c of cards) {
    if (c.isJoker) return false;
  }
  const firstRank = cards[0].rank;
  if (typeof firstRank !== 'number') return false;
  return cards.every(c => typeof c.rank === 'number' && c.rank === firstRank);
}

export function isValidRun(naturals: readonly Card[], wildCards?: ReadonlyArray<Card>): boolean {
  const naturalCount = naturals.length;
  const wildCardList = wildCards ?? [];

  if (naturalCount === 0) return false;
  if (naturalCount < wildCardList.length) return false;

  const suits = new Set(naturals.map(c => c.suit));
  if (suits.size !== 1) return false;

  const uniqueSize = new Set(naturals.map(c => c.rank)).size;
  if (uniqueSize !== naturalCount) return false;

  const totalLen = naturalCount + wildCardList.length;
  if (totalLen < 3) return false;
  if (totalLen > 13) return false;

  const uniqueRanks: number[] = [...new Set(naturals.map(c => c.rank))].filter((r): r is number => typeof r === 'number');
  for (let start = 2; start <= 14; start++) {
    let fits = true;
    for (const r of uniqueRanks) {
      const posNat = r - 2;
      const posStart = start - 2;
      const dist = (posNat - posStart + 13) % 13;
      if (dist >= totalLen) { fits = false; break; }
    }
    if (fits) return true;
  }

  return false;
}

// --- Sort Helpers (testable, pure) ---

const SUIT_ORDER: Readonly<Record<string, number>> = { diamonds: 1, clubs: 2, hearts: 3, spades: 4 };

export function sortByRank(cards: readonly Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (a.isJoker && !b.isJoker) return 1;
    if (!a.isJoker && b.isJoker) return -1;
    const aRank = typeof a.rank === 'number' ? a.rank : Infinity;
    const bRank = typeof b.rank === 'number' ? b.rank : Infinity;
    if (aRank !== bRank) return aRank - bRank;
    if (a.suit !== b.suit) return (SUIT_ORDER[a.suit] ?? 0) - (SUIT_ORDER[b.suit] ?? 0);
    return a.id.localeCompare(b.id);
  });
}

export function sortBySuit(cards: readonly Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (a.isJoker && !b.isJoker) return 1;
    if (!a.isJoker && b.isJoker) return -1;
    if (a.suit !== b.suit) return (SUIT_ORDER[a.suit] ?? 0) - (SUIT_ORDER[b.suit] ?? 0);
    const aRank = typeof a.rank === 'number' ? a.rank : Infinity;
    const bRank = typeof b.rank === 'number' ? b.rank : Infinity;
    if (aRank !== bRank) return aRank - bRank;
    return a.id.localeCompare(b.id);
  });
}

// --- Meld Class ---

export class Meld {
  type: MeldType;
  owner: number;
  cards: Card[];
  isContract: boolean;

  constructor(type: MeldType, owner: number, cards: readonly Card[]) {
    this.type = type;
    this.owner = owner;
    this.cards = [...cards];
    this.isContract = false;
  }

  add(card: Card): void {
    this.cards.push(card);
  }

  removeJoker(cardId: string): boolean {
    const idx = this.cards.findIndex(c => c.id === cardId);
    if (idx !== -1 && this.cards[idx].isJoker) {
      this.cards.splice(idx, 1);
      return true;
    }
    return false;
  }

  get naturalCount(): number {
    return this.cards.filter(c => !c.isJoker).length;
  }

  get wildCount(): number {
    return this.cards.filter(c => c.isJoker).length;
  }
}

export class ActionLogEntry {
  player: string;
  dealNumber: number;
  action: string;
  detail: string;
  timestamp: number;

  constructor(player: string, dealNumber: number, actionName: string, detail: string = '') {
    this.player = player;
    this.dealNumber = dealNumber;
    this.action = actionName;
    this.detail = detail;
    this.timestamp = Date.now();
  }
}

// --- Player Class ---

export const CONTRACTS: Contract[] = [
  { count: 2, minSize: 3 },
  { count: 1, minSize: 4 },
  { count: 2, minSize: 4 },
  { count: 1, minSize: 5 },
  { count: 2, minSize: 5 },
  { count: 1, minSize: 6 },
];

export class Player {
  id: number;
  name: string;
  isHuman: boolean;
  hand: string[] = [];
  chips: number = 6;
  score: number = 0;
  hasMelded: boolean = false;

  constructor(id: number, name?: string) {
    this.id = id;
    this.name = name ?? (id === 0 ? 'You' : `CPU ${id}`);
    this.isHuman = id === 0;
  }

  get handCardCount(): number {
    return this.hand.length;
  }
}

// --- Game State Machine ---

export interface StateEvent {
  dealNumber?: number;
  phase?: GameState;
  currentPlayerIndex?: number;
  [key: string]: unknown;
}

export interface MessagesOut {
  onStateChanged?: (event: StateEvent) => void;
  onMessage?: (msg: string) => void;
  delay?: () => void;
}

export class Game {
  playerName: string;
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
  _lastAction: ActionLogEntry | null = null;

  constructor(playerName?: string) {
    this.playerName = playerName || 'Player 1';
    this.players = [new Player(0, this.playerName), new Player(1), new Player(2), new Player(3)];
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
    this._lastAction = null;
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
    this.deck = new Deck();
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
    this.currentPlayerIndex = (this.dealNumber - 1) % 4;
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
    this._lastAction = new ActionLogEntry(player.name, this.dealNumber, 'Started Turn', 'drew a card from stock');
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
    this._lastAction = new ActionLogEntry(player.name, this.dealNumber, 'Bought Card', `bought a card and drew ${extraDraws}${extraDraws > 1 ? ' extra' : ''} cards`);
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

    const meldTypeText = type === 'set' ? 'Played Set' : 'Played Run';
    this._lastAction = new ActionLogEntry(player.name, this.dealNumber, meldTypeText, `${cardIds.length} card${cardIds.length > 1 ? 's' : ''}`);
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

    this._lastAction = new ActionLogEntry(player.name, this.dealNumber, 'Add to Meld', `${cardIds.length} card${cardIds.length > 1 ? 's' : ''}`);
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
      this._lastAction = new ActionLogEntry(player.name, this.dealNumber, 'Discarded', `${discardedCard ? discardedCard.rank + ' of ' + discardedCard.suit : cardId} — went out!`);
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
    this._lastAction = new ActionLogEntry(player.name, this.dealNumber, 'Discarded', `${discardedCard ? discardedCard.rank + ' of ' + discardedCard.suit : cardId} (${player.hand.length} cards remaining)`);
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
    for (const player of this.players) {
      if (player.hand.length === 0) continue;
      let penalty = 0;
      for (const cardId of player.hand) {
        const card = this.allCards[cardId];
        if (card) penalty += card.pointValue;
      }
      player.score += penalty;
    }
    this.state = 'dealover';
    this.publish('stateChanged');
  }

  endGame(): void {
    for (const player of this.players) {
      player.score -= player.chips * 10;
    }
    this.state = 'gameover';
    const leaderboard = this.getLeaderboard();
    const winnerName = leaderboard[0]?.player?.name ?? 'TBD';
    this._lastAction = new ActionLogEntry('Telefunken — Peru v1', this.dealNumber, 'Game Over', `${winnerName} wins! Final standings: ${leaderboard.map(e => `${e.rank}. ${e.player.name}`).join(', ')}`);
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
    const result: Array<{ type: MeldType; cardIds: string[] }> = [];
    const handIds = [...player.hand];

    const rankGroups: Record<number, Card[]> = {};
    const naturals = handIds.map(id => this.allCards[id]).filter(Boolean) as Card[];
    for (const c of naturals) {
      if (c.isJoker || typeof c.rank !== 'number') continue;
      if (!rankGroups[c.rank]) rankGroups[c.rank] = [];
      rankGroups[c.rank].push(c);
    }

    const meldedIds = new Set<string>();
    for (const rank of Object.keys(rankGroups)) {
      const group = rankGroups[parseInt(rank, 10)];
      if (group.length >= 3) {
        const ids = group.map(c => c.id);
        result.push({ type: 'set', cardIds: ids });
        for (const id of ids) meldedIds.add(id);
      }
    }

    const remainingNaturals = naturals.filter(c => c.isJoker || meldedIds.has(c.id) || typeof c.rank === 'number');
    if (!remainingNaturals.length) return result;

    const suitGroups: Record<string, Card[]> = {};
    for (const c of remainingNaturals) {
      if (c.isJoker || typeof c.rank !== 'number') continue;
      if (!suitGroups[c.suit]) suitGroups[c.suit] = [];
      suitGroups[c.suit].push(c);
    }

    let sharedJokerPool = 0;
    for (const id of handIds) {
      const c = this.allCards[id];
      if (c && c.isJoker) sharedJokerPool++;
    }

    for (const suit of Object.keys(suitGroups)) {
      const group = suitGroups[suit];
      if (!group.length) continue;
      group.sort((a, b) => {
        const aRank = typeof a.rank === 'number' ? a.rank : Infinity;
        const bRank = typeof b.rank === 'number' ? b.rank : Infinity;
        return aRank - bRank;
      });

      const used = new Set<string>();

      for (let i = 0; i < group.length; i++) {
        if (used.has(group[i].id)) continue;

        let currentRun: Card[] = [group[i]];
        used.add(group[i].id);
        let lastRankNum: number;
        if (typeof group[i].rank === 'number') {
          lastRankNum = Number(group[i].rank);
        } else {
          lastRankNum = 0;
        }

        for (let j = i + 1; j < group.length; j++) {
          const nextCard = group[j];
          if (used.has(nextCard.id)) continue;
          if (typeof nextCard.rank !== 'number') continue;

          let rankNum: number;
          if (typeof nextCard.rank === 'number') {
            rankNum = Number(nextCard.rank);
          } else {
            rankNum = 0;
          }
          const gap = this.forwardRankDistance(lastRankNum, rankNum);
          if (gap === 2) {
            if (sharedJokerPool > 0) {
              currentRun.push(nextCard);
              used.add(nextCard.id);
              lastRankNum = nextCard.rank;
              sharedJokerPool--;
            } else {
              break;
            }
          } else if (gap > 2) {
            break;
          } else {
            currentRun.push(nextCard);
            used.add(nextCard.id);
            lastRankNum = nextCard.rank;
          }
        }

        const wildNeeded = this.countWildsForRun(currentRun);
        if ((currentRun.length + wildNeeded) >= 3 && wildNeeded <= currentRun.length) {
          result.push({ type: 'run', cardIds: currentRun.map(c => c.id) });
          for (const c of currentRun) meldedIds.add(c.id);
        }
      }
    }

    return result;
  }

  forwardRankDistance(a: number, b: number): number {
    const posA = ((a - 2) % 13 + 13) % 13;
    const posB = ((b - 2) % 13 + 13) % 13;
    return (posB - posA + 13) % 13;
  }

  countWildsForRun(naturals: readonly Card[]): number {
    if (naturals.length < 2) return Infinity;
    let wilds = 0;
    for (let i = 1; i < naturals.length; i++) {
      const a = naturals[i - 1].rank;
      const b = naturals[i].rank;
      if (typeof a !== 'number' || typeof b !== 'number') return Infinity;
      const gap = this.forwardRankDistance(a, b);
      if (gap > 2) return Infinity;
      wilds += Math.max(0, gap - 1);
    }
    return wilds;
  }

  isConsequencePossible(naturals: readonly Card[], maxWilds: number): boolean {
    const needed = this.countWildsForRun(naturals);
    return needed <= maxWilds && (naturals.length + Math.min(needed, maxWilds)) >= 3;
  }

  aiDiscard(playerId: number): string | null {
    const player = this.players[playerId];
    if (!player || !player.hand.length) return null;

    const melds = this.aiEvaluateMelds(playerId);
    const meldableIds = new Set<string>();
    for (const m of melds) {
      for (const id of m.cardIds) meldableIds.add(id);
    }

    let worstCardId: string | null = null;
    let worstScore = -1;
    for (const id of player.hand) {
      const card = this.allCards[id];
      if (!card) continue;
      const score = meldableIds.has(id) ? 0 : card.pointValue;
      if (score > worstScore || worstCardId === null) {
        worstScore = score;
        worstCardId = id;
      }
    }

    return worstCardId;
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

    const prevIdx = this.discardBuyerPromptIndex;
    const discarderIdx = (prevIdx - 1 + 4) % 4;
    let nextIdx = (prevIdx + 1) % 4;
    let loops = 0;
    while (nextIdx !== discarderIdx && loops < 4) {
      const p = this.players[nextIdx];
      if (p.chips > 0 && !p.hasMelded) break;
      nextIdx = (nextIdx + 1) % 4;
      loops++;
    }

    if (nextIdx === discarderIdx || loops >= 4) {
      this.discardBuyerPromptIndex = -1;
      this.publish('stateChanged');
    } else {
      this.discardBuyerPromptIndex = nextIdx;
      this.publish('stateChanged');
    }
  }

  getLeaderboard(): Array<{ rank: number; player: Player; penaltyScore: number; chipBonus: number }> {
    const sorted = [...this.players].sort((a, b) => a.score - b.score);
    return sorted.map((player, rankIdx) => ({
      rank: rankIdx + 1,
      player,
      penaltyScore: player.score,
      chipBonus: player.chips * 10,
    }));
  }

  getWinner(): Player | null {
    const lb = this.getLeaderboard();
    if (lb.length === 0) return null;
    return lb[0].player;
  }
}
