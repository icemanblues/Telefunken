// Telefunken Peru v1 — Game Logic (ES Module)

export class Card {
  constructor(id, suit, rank) {
    this.id = id;
    this.suit = suit;
    this.rank = rank;
  }

  get pointValue() {
    if (this.suit === 'joker') return 20;
    if (this.rank >= 3 && this.rank <= 9) return this.rank;
    if (this.rank >= 10 && this.rank <= 13) return 10;
    if (this.rank === 14) return 15;
    if (this.rank === 2) return 20;
    return 0;
  }

  get isJoker() {
    return this.suit === 'joker';
  }
}

export class Deck {
  constructor() {
    this.cards = [];
    let idx = 0;
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
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

  get remaining() {
    return this.cards.length;
  }

  shuffle() {
    const arr = this.cards;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  draw() {
    if (this.cards.length === 0) return null;
    return this.cards.pop();
  }
}

// --- Pure Validators ---

export function isValidSet(cards) {
  if (!Array.isArray(cards) || cards.length < 3) return false;
  for (const c of cards) {
    if (c.isJoker) return false;
  }
  const firstRank = cards[0].rank;
  return cards.every(c => c.rank === firstRank);
}

export function isValidRun(naturals, wildCards) {
  const naturalCount = naturals.length;
  const wildCount = (wildCards || []).length;

  if (naturalCount === 0) return false;
  if (naturalCount < wildCount) return false;

  const suits = new Set(naturals.map(c => c.suit));
  if (suits.size !== 1) return false;

  const uniqueSize = new Set(naturals.map(c => c.rank)).size;
  if (uniqueSize !== naturalCount) return false;

  const totalLen = naturalCount + wildCount;
  if (totalLen < 3) return false;
  if (totalLen > 13) return false;

  const uniqueRanks = [...new Set(naturals.map(c => c.rank))];
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

const SUIT_ORDER = { diamonds: 1, clubs: 2, hearts: 3, spades: 4 };

export function sortByRank(cards) {
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

export function sortBySuit(cards) {
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
  constructor(type, owner, cards) {
    this.type = type;
    this.owner = owner;
    this.cards = [...cards];
    this.isContract = false;
  }

  add(card) {
    this.cards.push(card);
  }

  removeJoker(cardId) {
    const idx = this.cards.findIndex(c => c.id === cardId);
    if (idx !== -1 && this.cards[idx].isJoker) {
      this.cards.splice(idx, 1);
      return true;
    }
    return false;
  }

  get naturalCount() {
    return this.cards.filter(c => !c.isJoker).length;
  }

  get wildCount() {
    return this.cards.filter(c => c.isJoker).length;
  }
}

// --- Player Class ---

const CONTRACTS = [
  { count: 2, minSize: 3 },
  { count: 1, minSize: 4 },
  { count: 2, minSize: 4 },
  { count: 1, minSize: 5 },
  { count: 2, minSize: 5 },
  { count: 1, minSize: 6 },
];

export class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name ?? (id === 0 ? 'You' : `CPU ${id}`);
    this.isHuman = id === 0;
    this.hand = [];
    this.chips = 6;
    this.score = 0;
    this.hasMelded = false;
  }

  get handCardCount() {
    return this.hand.length;
  }
}

// --- Game State Machine ---

export class Game {
  constructor(playerName) {
    this.playerName = playerName || 'Player 1';
    this.players = [new Player(0, this.playerName), new Player(1), new Player(2), new Player(3)];
    this.deck = null;
    this.discardPile = [];
    this.tableMelds = [];
    this.dealNumber = 1;
    this.currentPlayerIndex = 0;
    this.state = 'init';
    this.allCards = {};
    this.discardBuyerPromptIndex = -1;
    this.messagesOut = {
      onStateChanged: null, 
      onMessage: null,
      delay: typeof setTimeout !== 'undefined' ? () => {} : null,
    };
  }

  reset(newName) {
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
  }

  startGame() {
    this.reset();
    if (this.dealNumber <= 6) {
      this.startDeal();
    }
  }

  getAllCards() {
    return this.allCards;
  }

  getCard(id) {
    return this.allCards[id] || null;
  }

  // --- Deal setup (Peru v1: dealer gets 12 cards, discards first) ---
  startDeal() {
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
    // Deal 11 cards to each player
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 11; j++) {
        const card = this.deck.draw();
        if (card) {
          this.players[i].hand.push(card.id);
          this.allCards[card.id] = card;
        }
      }
    }
    // Dealer gets 12th card, then immediately discards one
    this.currentPlayerIndex = (this.dealNumber - 1) % 4;
    const dealerCard = this.deck.draw();
    if (dealerCard) {
      this.players[this.currentPlayerIndex].hand.push(dealerCard.id);
      this.allCards[dealerCard.id] = dealerCard;
    }
    // Dealer must discard immediately
    this.state = 'discard';
    this.publish('dealStarted');
  }

  drawFromStock(playerId) {
    if (this.state !== 'draw') return false;
    const player = this.players[playerId];
    const card = this.deck.draw();
    if (!card) {
      this.forceEndDeal();
      return false;
    }
    player.hand.push(card.id);
    this.allCards[card.id] = card;
    this.state = 'meld';
    this.publish('stateChanged');
    return true;
  }

  buyDiscard(playerId) {
    const player = this.players[playerId];
    if (!player || player.hasMelded || player.chips <= 0) return false;
    if (this.discardPile.length === 0) return false;
    player.chips -= 1;
    // Take top discard card
    const topCard = this.discardPile.pop();
    player.hand.push(topCard);
    // Penalty: draw extra cards from stock
    // Own turn → draw 2 extra. Off-turn buy (human only) → draw 1 extra.
    const isOwnTurn = (playerId === this.currentPlayerIndex && this.state === 'draw');
    const extraDraws = isOwnTurn ? 2 : 1;
    for (let i = 0; i < extraDraws; i++) {
      const card = this.deck.draw();
      if (!card) break;
      player.hand.push(card.id);
      this.allCards[card.id] = card;
    }
    // Transition to meld phase only when on own turn
    if (isOwnTurn) {
      this.state = 'meld';
    }
    // When buying during the buyDiscard purchase rotation, also transition to meld
    if (this.state === 'buyDiscard') {
      this.state = 'meld';
    }
    this.publish('stateChanged');
    return true;
  }

  playMeld(playerId, cardIds, type) {
    if (this.state === 'discard' || this.state === 'dealover' || this.state === 'gameover') return false;
    const player = this.players[playerId];
    if (!player) return false;

    const cards = cardIds.map(id => this.allCards[id]).filter(Boolean);
    if (cards.length !== cardIds.length || !cards.length) return false;

    // Verify all cards are in player's hand
    for (const id of cardIds) {
      if (!player.hand.includes(id)) return false;
    }

    let valid = false;
    if (type === 'set') {
      valid = isValidSet(cards);
    } else if (type === 'run') {
      const naturals = cards.filter(c => !c.isJoker);
      const wilds = cards.filter(c => c.isJoker);
      valid = isValidRun(naturals, wilds);
    }

    if (!valid) return false;

    // First meld must satisfy contract requirements (sets only in Peru v1)
    if (!player.hasMelded) {
      const contract = CONTRACTS[this.dealNumber - 1];
      if (type === 'run') return false;
      if (cards.length < contract.minSize) return false;
    }

    // Cannot meld to zero — must leave at least 1 card for final discard
    if (player.hand.length <= cards.length) return false;

    const meld = new Meld(type, playerId, cards);
    if (!player.hasMelded) {
      meld.isContract = true;
    }
    this.tableMelds.push(meld);
    player.hand = player.hand.filter(id => !cardIds.includes(id));
    player.hasMelded = true;

    this.publish('stateChanged');
    return true;
  }

  addToExistingMeld(playerId, meldIndex, cardIds) {
    if (this.state === 'discard' || this.state === 'dealover' || this.state === 'gameover') return false;
    const meld = this.tableMelds[meldIndex];
    if (!meld) return false;
    const player = this.players[playerId];
    if (!player || !player.hasMelded) return false;

    const cards = cardIds.map(id => this.allCards[id]).filter(Boolean);
    if (cards.length !== cardIds.length || !cards.length) return false;

    for (const id of cardIds) {
      if (!player.hand.includes(id)) return false;
    }

    let canAddAll = true;
    if (meld.type === 'set') {
      const meldNaturals = meld.cards.filter(c => !c.isJoker);
      for (const c of cards) {
        if (c.isJoker || c.rank !== meldNaturals[0].rank) {
          canAddAll = false;
          break;
        }
      }
    } else if (meld.type === 'run') {
      const existingNaturals = meld.cards.filter(c => !c.isJoker);
      if (!existingNaturals.length) return false;
      for (const c of cards) {
        if (!c.isJoker && c.suit !== existingNaturals[0].suit) {
          canAddAll = false;
          break;
        }
      }
      const newNaturals = [...existingNaturals, ...cards.filter(c => !c.isJoker)];
      const newWilds = [...meld.cards.filter(c => c.isJoker), ...cards.filter(c => c.isJoker)];
      if (!isValidRun(newNaturals, newWilds)) canAddAll = false;
    }

    if (!canAddAll) return false;

    // Cannot meld to zero — must leave at least 1 card for final discard
    if (player.hand.length <= cards.length) {
      return false;
    }

    for (const c of cards) {
      meld.add(c);
      player.hand = player.hand.filter(id => id !== c.id);
    }

    this.publish('stateChanged');
    return true;
  }

  discardCard(playerId, cardId) {
    if (this.state !== 'discard') return false;
    const player = this.players[playerId];
    if (!player || !player.hand.includes(cardId)) return false;

    player.hand = player.hand.filter(id => id !== cardId);
    this.discardPile.push(cardId);

    // Final discard: hand reaches zero → player went out
    if (player.hand.length === 0) {
      this.state = 'dealover';
      this.scoreDeal();
      this.publish('stateChanged');
      return true;
    }

    const prevIndex = (this.currentPlayerIndex - 1 + 4) % 4;
    // If we haven't started the buyDiscard rotation for this deal, this is the initial dealer discard — skip buy phase
    let isInitialDealDiscard = (this.discardBuyerPromptIndex < 0);

    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;

    if (isInitialDealDiscard) {
      // Initial deal discard: skip buy phase, go straight to draw
      this.state = 'draw';
    } else {
      // Regular discard: enter the buyDiscard purchase rotation
      // Start from next player after the one who just discarded; skip the discarder themselves
      const newPromptIndex = (this.currentPlayerIndex) % 4;
      if (newPromptIndex === prevIndex) {
        // Only the discarder remains — end rotation, go to draw
        this.discardBuyerPromptIndex = -1;
        this.state = 'draw';
      } else {
        this.discardBuyerPromptIndex = newPromptIndex;
        this.state = 'buyDiscard';
      }
    }
    this.publish('stateChanged');
    return true;
  }

  confirmDiscard(playerId) {
    const player = this.players[playerId];
    if (!player || !player.hand.length) return false;
    if (this.state !== 'meld') return false;
    this.state = 'discard';
    this.publish('stateChanged');
    return true;
  }

  checkContractSatisfaction(playerId) {
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

  scoreDeal() {
    // Player who went out scores 0, others get penalty for remaining hand cards
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

  endGame() {
    for (const player of this.players) {
      player.score -= player.chips * 10;
    }
    this.state = 'gameover';
    this.publish('stateChanged');
  }

  getNextPlayerIndex() {
    return this.currentPlayerIndex;
  }

  advanceDeal() {
    this.dealNumber++;
    if (this.dealNumber > 6) {
      this.endGame();
    } else {
      this.startDeal();
    }
  }

  isCurrentPlayerAI() {
    const p = this.players[this.currentPlayerIndex];
    return p && !p.isHuman;
  }

  endTurn(_playerId) {
    if (this.state !== 'meld') return false;
    // Stock exhaustion check: on current player's discard, see if next players can draw
    this.state = 'discard';
    this.publish('stateChanged');
    return true;
  }

  isStockEmpty() {
    return this.deck.remaining === 0;
  }

  forceEndDeal() {
    if (this.state === 'gameover' || this.state === 'dealover') return false;
    this.scoreDeal();
    return true;
  }

  publish(event) {
    if (this.messagesOut && typeof this.messagesOut.onStateChanged === 'function') {
      this.messagesOut.onStateChanged({
        dealNumber: this.dealNumber,
        phase: this.state,
        currentPlayerIndex: this.currentPlayerIndex,
        ...event,
      });
    }
  }

  // --- AI Decision Logic ---

  aiEvaluateMelds(playerId) {
    const player = this.players[playerId];
    if (!player || !player.hand.length) return [];
    const result = [];
    const handIds = [...player.hand];

    // Group naturals by rank for sets
    const rankGroups = {};
    const naturals = handIds.map(id => this.allCards[id]).filter(Boolean);
    for (const c of naturals) {
      if (c.isJoker) continue;
      if (!rankGroups[c.rank]) rankGroups[c.rank] = [];
      rankGroups[c.rank].push(c);
    }

    // Find sets: 3+ naturals same rank (jokers excluded from sets per Peru v1)
    const meldedIds = new Set();
    for (const rank of Object.keys(rankGroups)) {
      const group = rankGroups[rank];
      if (group.length >= 3) {
        const ids = group.map(c => c.id);
        result.push({ type: 'set', cardIds: ids });
        for (const id of ids) meldedIds.add(id);
      }
    }

    // Remove jokers from further set/run consideration since they can't go in sets
    const remainingNaturals = naturals.filter(c => c.isJoker || !meldedIds.has(c.id));
    if (!remainingNaturals.length) return result;

    // Group remaining naturals by suit for runs
    const suitGroups = {};
    for (const c of remainingNaturals) {
      if (c.isJoker) continue;
      if (!suitGroups[c.suit]) suitGroups[c.suit] = [];
      suitGroups[c.suit].push(c);
    }

    // Find runs: consecutive same-suit sequences
    let sharedJokerPool = 0;
    for (const id of handIds) {
      const c = this.allCards[id];
      if (c && c.isJoker) sharedJokerPool++;
    }

    for (const suit of Object.keys(suitGroups)) {
      const group = suitGroups[suit];
      if (!group.length) continue;
      group.sort((a, b) => a.rank - b.rank);

      const used = new Set();

      for (let i = 0; i < group.length; i++) {
        if (used.has(group[i].id)) continue;

        let currentRun = [group[i]];
        used.add(group[i].id);
        let lastRank = group[i].rank;

        for (let j = i + 1; j < group.length; j++) {
          const nextCard = group[j];
          if (used.has(nextCard.id)) continue;

          const gap = this.forwardRankDistance(lastRank, nextCard.rank);
          if (gap === 2) {
            if (sharedJokerPool > 0) {
              currentRun.push(nextCard);
              used.add(nextCard.id);
              lastRank = nextCard.rank;
              sharedJokerPool--;
            } else {
              break;
            }
          } else if (gap > 2) {
            break;
          } else {
            currentRun.push(nextCard);
            used.add(nextCard.id);
            lastRank = nextCard.rank;
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

  forwardRankDistance(a, b) {
    const posA = ((a - 2) % 13 + 13) % 13;
    const posB = ((b - 2) % 13 + 13) % 13;
    return (posB - posA + 13) % 13;
  }

  countWildsForRun(naturals) {
    if (naturals.length < 2) return Infinity;
    let wilds = 0;
    for (let i = 1; i < naturals.length; i++) {
      const gap = this.forwardRankDistance(naturals[i - 1].rank, naturals[i].rank);
      if (gap > 2) return Infinity;
      wilds += Math.max(0, gap - 1);
    }
    return wilds;
  }

  isConsequencePossible(naturals, maxWilds) {
    const needed = this.countWildsForRun(naturals);
    return needed <= maxWilds && (naturals.length + Math.min(needed, maxWilds)) >= 3;
  }

  aiDiscard(playerId) {
    const player = this.players[playerId];
    if (!player || !player.hand.length) return null;

    // Evaluate melds to find meldable cards
    const melds = this.aiEvaluateMelds(playerId);
    const meldableIds = new Set();
    for (const m of melds) {
      for (const id of m.cardIds) meldableIds.add(id);
    }

    // Score each card: meldable cards get 0, unmatched get pointValue
    let worstCardId = null;
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

  aiWantsDiscard(playerId) {
    const player = this.players[playerId];
    if (!player || !player.hand.length) return false;
    if (this.discardPile.length === 0) return false;

    const discardTopId = this.discardPile[this.discardPile.length - 1];
    const topCard = this.allCards[discardTopId];
    if (!topCard) return false;

    // Check if topCard completes or helps start a valid meld worth more than 1 chip cost
    // Temporarily augment hand for evaluation (restored safely via try-finally)
    const oldHand = [...player.hand];
    player.hand.push(discardTopId);
    let meldsFound;
    try {
      meldsFound = this.aiEvaluateMelds(playerId);
    } finally {
      player.hand = oldHand;
    }

    // Check if meld value increased meaningfully
    if (meldsFound.length > 0) {
      let meldScore = 0;
      for (const m of meldsFound) {
        if (m.cardIds.includes(discardTopId)) {
          meldScore += m.cardIds.length;
        }
      }
      // Value: cards locked into mel ds / 1 chip cost
      if (meldScore >= 3) return true;
    }

    return false;
  }

  aiDraw(playerId) {
    if (this.state !== 'draw') return false;
    // Decide draw vs buy discard
    if (this.aiWantsDiscard(playerId)) {
      this.buyDiscard(playerId);
    } else {
      this.drawFromStock(playerId);
    }
    return true;
  }

  aiPlayTurn(playerId) {
    const player = this.players[playerId];
    if (!player || player.isHuman) return false;

    // Handle initial discard phase (dealer): skip to drawing or discarding directly
    if (this.state === 'discard' && player.hand.length > 1) {
      const cardId = this.aiDiscard(playerId);
      if (cardId) {
        return this.discardCard(playerId, cardId);
      }
      return false;
    }

    // If in draw phase: draw and move to meld
    if (this.state === 'draw') {
      const drew = this.aiDraw(playerId);
      if (!drew) return false;
      // After drawing, we'll be in meld phase — continue from there next tick
      return true;
    }

    // In meld phase: play valid melds
    if (this.state === 'meld') {
      const melds = this.aiEvaluateMelds(playerId);
      let played = false;

      // Prefer sets for first meld to satisfy contract (Peru v1 rule)
      if (!player.hasMelded) {
        const contract = CONTRACTS[this.dealNumber - 1];
        const validSets = melds.filter(
          m => m.type === 'set' && m.cardIds.length >= contract.minSize
        );
        for (const s of validSets) {
          if (this.playMeld(playerId, s.cardIds, 'set')) {
            played = true;
            // Check if we've met full contract count to move on
            break;
          }
        }
      }

      // If still in meld phase, try remaining melds or add-to-meld
      if (!played && this.state === 'meld') {
        for (const m of melds) {
          // Only attempt new melds; skip already-played ones
          const allInHand = m.cardIds.every(id => player.hand.includes(id));
          if (allInHand && m.cardIds.length >= 3) {
            try {
              this.playMeld(playerId, m.cardIds, m.type);
            } catch { /* ignore */ }
          }
        }
      }

      // Move to discard phase
      return this.endTurn(playerId);
    }

    // If in buyDiscard phase: decide whether to buy the discard
    if (this.state === 'buyDiscard') {
      const wants = this.aiWantsDiscard(playerId);
      if (wants && player.chips > 0) {
        return this.buyDiscard(playerId);
      }
      // Don't want or can't buy — advance the prompt to next player
      this.advanceBuyDiscardPrompt();
      return true;
    }

    // If in discard phase after melding: pick a card and discard
    if (this.state === 'discard') {
      const cardId = this.aiDiscard(playerId);
      if (cardId) {
        return this.discardCard(playerId, cardId);
      }
      return false;
    }

    return false;
  }

  advanceBuyDiscardPrompt() {
    if (this.discardBuyerPromptIndex < 0) return;

    // Advance to next player in rotation
    const prevIdx = this.discardBuyerPromptIndex;
    const discarderIdx = (prevIdx - 1 + 4) % 4;
    let nextIdx = (prevIdx + 1) % 4;
    let loops = 0;
    while (nextIdx !== discarderIdx && loops < 4) {
      // Check if the player can buy (has chips and hasn't melded)
      const p = this.players[nextIdx];
      if (p.chips > 0 && !p.hasMelded) break;
      nextIdx = (nextIdx + 1) % 4;
      loops++;
    }

    if (nextIdx === discarderIdx || loops >= 4) {
      // All players have had a chance, go to draw phase
      this.discardBuyerPromptIndex = -1;
      this.publish('stateChanged');
    } else {
      this.discardBuyerPromptIndex = nextIdx;
      this.publish('stateChanged');
    }
  }

  getLeaderboard() {
    // Returns players sorted by score ascending (lowest = best rank, 1st place)
    const sorted = [...this.players].sort((a, b) => a.score - b.score);
    return sorted.map((player, rankIdx) => ({
      rank: rankIdx + 1,
      player,
      penaltyScore: player.score,
      chipBonus: player.chips * 10,
    }));
  }

  getWinner() {
    const lb = this.getLeaderboard();
    if (lb.length === 0) return null;
    return lb[0].player;
  }
}

// --- Browser UI Init (guarded for Jest compatibility) ---

if (typeof window !== 'undefined') {
  const suitSymbol = { hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663', spades: '\u2660', joker: String.fromCodePoint(0x1F0CF) };
  const rankLabel = { 2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'10',11:'J',12:'Q',13:'K',14:'A', joker:'' };

  // -- Toast system --
  let toastTimeout = null;
  function showToast(msg, duration) {
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

  // -- Selection mode tracking --
  let discardMode = false;
  let currentSortMode = null;

  // Game instance (hoisted for initUI + cardElement closure)
  let game = null;

  function cardElement(cardId, allCards, selectable) {
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
      el.innerHTML = `<span>${rankLabel[card.rank]}</span><span style="font-size:1.3rem">${suitSymbol[card.suit]}</span>`;
    }
    if (selectable) {
      el.addEventListener('click', () => {
        if (discardMode && game.state === 'discard' && game.currentPlayerIndex === 0) {
          // Single-select discard: confirm immediately on click
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

  function renderBoard(game) {
    const contract = CONTRACTS[game.dealNumber - 1] || null;

    // Round indicator
    document.getElementById('deal-label').textContent = `Deal #${game.dealNumber}`;
    document.getElementById('contract-label').textContent = contract
      ? `Contract: ${contract.count}\u00D7${contract.minSize}`
      : 'Game Over';

    // Scoreboard body
    const tbody = document.getElementById('scoreboard-body');
    tbody.innerHTML = '';
    for (const p of game.players) {
      const tr = document.createElement('tr');
      if (!p.isHuman && !p.hand.length) {
        // only show hand count for AI
      }
      const cells = [
        p.name,
        p.isHuman ? p.handCardCount : '?',
        p.chips,
        p.score,
        game.currentPlayerIndex === p.id ? '\u25B6 ACTIVE' : (p.hand.length === 0 && game.state === 'dealover') ? 'OUT' : '',
      ];
      for (const txt of cells) {
        const td = document.createElement('td');
        td.textContent = txt;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    // Melds area
    const mc = document.getElementById('melds-container');
    mc.innerHTML = '';
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
        cardsRow.appendChild(cardElement(c.id, game.allCards, false));
      }
      group.appendChild(cardsRow);
      mc.appendChild(group);
    }

    // Populate add-to-meld dropdown
    const addSel = document.getElementById('add-meld-target');
    addSel.innerHTML = '';
    for (let i = 0; i < game.tableMelds.length; i++) {
      const m = game.tableMelds[i];
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${game.players[m.owner].name}'s ${m.type} (${m.cards.length} cards)`;
      addSel.appendChild(opt);
    }

    // Stock / discard piles
    document.getElementById('stock-count').textContent = game.deck ? game.deck.remaining : 0;
    const dtEl = document.getElementById('discard-top');
    dtEl.innerHTML = '';
    if (game.discardPile.length) {
      const topId = game.discardPile[game.discardPile.length - 1];
      const card = game.getCard(topId);
      if (card) {
        const el = cardElement(topId, game.allCards, false);
        dtEl.appendChild(el);
      }
    } else {
      dtEl.textContent = '—';
    }

    // Human hand
    const hh = document.getElementById('human-hand');
    hh.innerHTML = '';
    const human = game.players[0];
    
    let cardObjs;
    if (currentSortMode === 'suit') {
      cardObjs = sortBySuit(human.hand.map(id => game.allCards[id]).filter(Boolean));
    } else if (currentSortMode === 'rank') {
      cardObjs = sortByRank(human.hand.map(id => game.allCards[id]).filter(Boolean));
    } else {
      cardObjs = human.hand.map(id => game.allCards[id]).filter(Boolean);
    }
    
    for (const card of cardObjs) {
      hh.appendChild(cardElement(card.id, game.allCards, true));
    }

    // Phase label
    document.getElementById('phase-label').textContent = `Phase: ${game.state}`;

    // Control gating based on phase / turn ownership
    updateControls(game);

    // Animate new meld entries
    document.querySelectorAll('.meld-group:last-child').forEach(g => g.classList.add('card-enter'));
  }

  function updateControls(game) {
    const human = game.players[0];
    const isHumanTurn = (game.currentPlayerIndex === 0);
    const btnBuy = document.getElementById('btn-buy');
    const endTurnBtn = document.getElementById('btn-end-turn');
    const meldControls = document.getElementById('meld-controls');
    const addMeldControls = document.getElementById('add-meld-controls');

    const enable = (el) => { el.style.pointerEvents = ''; el.style.opacity = '1'; };
    const disable = (el) => { el.style.pointerEvents = 'none'; el.style.opacity = '0.4'; };

    if (game.state === 'dealover' || game.state === 'gameover') {
      disable(meldControls); disable(addMeldControls); endTurnBtn.disabled = true;
      if (game.state === 'gameover') {
        showToast('Game Over — lowest score wins!');
      } else {
        showToast('Deal complete.');
      }
    } else if (isHumanTurn && game.state === 'meld') {
      enable(meldControls); endTurnBtn.disabled = false;
      if (human.hasMelded) enable(addMeldControls); else disable(addMeldControls);
    } else if (isHumanTurn && game.state === 'discard') {
      discardMode = true; enable(meldControls); disable(addMeldControls); endTurnBtn.disabled = false;
      showToast('Click a card to discard.');
    } else if (game.state === 'buyDiscard') {
      // Discard-buy phase: hide regular controls during this phase
      disable(meldControls); disable(addMeldControls); endTurnBtn.disabled = true;
      const promptIdx = game.discardBuyerPromptIndex;
      if (promptIdx >= 0 && promptIdx < game.players.length) {
        showToast(`${game.players[promptIdx].name}'s turn to decide.`);
      }
    } else if (isHumanTurn && game.state === 'draw') {
      disable(meldControls); disable(addMeldControls); endTurnBtn.disabled = true;
    } else {
      // Not human's turn
      disable(meldControls); disable(addMeldControls); endTurnBtn.disabled = true;
      if (!isHumanTurn && !game.isCurrentPlayerAI()) {
        showToast(`${game.players[game.currentPlayerIndex].name}'s turn.`);
      } else if (game.isCurrentPlayerAI()) {
        showToast(`🤖 ${game.players[game.currentPlayerIndex].name} is thinking...`);
      }
    }

    // Buy button: always visible when eligible, regardless of whose turn
    if (human.hasMelded || human.chips <= 0 || game.discardPile.length === 0
        || game.state === 'dealover' || game.state === 'gameover' || game.state === 'buyDiscard') {
      btnBuy.style.display = 'none';
    } else {
      btnBuy.style.display = '';
    }
  }

  function renderGameOver() {
    const overlay = document.getElementById('gameover-container');
    if (!overlay) return;

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';

    // Use the game instance from initUI closure
    const leaderboard = game.getLeaderboard();
    for (const entry of leaderboard) {
      const tr = document.createElement('tr');
      if (entry.rank === 1) tr.classList.add('rank-1');
      td(tr, String(entry.rank));
      td(tr, entry.player.name);

      // Show raw penalty score and chip bonus as negative deduction
      td(tr, `${entry.penaltyScore}`);
      td(tr, `-${entry.chipBonus}`);

      const finalScore = entry.penaltyScore - entry.chipBonus;
      td(tr, `${finalScore}`);

      tbody.appendChild(tr);
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

  function hideGameOver() {
    const overlay = document.getElementById('gameover-container');
    if (overlay) overlay.style.display = 'none';
  }

  function td(parent, text) {
    const el = document.createElement('td');
    el.textContent = text;
    parent.appendChild(el);
  }

  function initUI() {

    // -- New Game Overlay helpers --
    function showNewGameOverlay() {
      const overlay = document.getElementById('new-game-overlay');
      if (!overlay) return;
      const input = document.getElementById('player-name-input');
      if (input) input.value = game.playerName || 'Player 1';
      overlay.style.display = 'flex';
    }

    showNewGameOverlay();


    // Wire buttons to game methods
    document.getElementById('btn-buy').addEventListener('click', () => {
      game.buyDiscard(0);
    });

    document.getElementById('btn-end-turn').addEventListener('click', () => {
      game.endTurn(0);
    });

    document.getElementById('btn-confirm-set').addEventListener('click', () => {
      const selected = [...document.querySelectorAll('#human-hand .card.selected')];
      const ids = selected.map(el => el.dataset.cardId);
      if (ids.length) {
        const ok = game.playMeld(0, ids, 'set');
        if (!ok) showToast('Invalid set — check eligibility.');
      }
    });

    document.getElementById('btn-confirm-run').addEventListener('click', () => {
      const selected = [...document.querySelectorAll('#human-hand .card.selected')];
      const ids = selected.map(el => el.dataset.cardId);
      if (ids.length) {
        const ok = game.playMeld(0, ids, 'run');
        if (!ok) showToast('Invalid run — check eligibility.');
      }
    });

    // Add-to-meld toggle wiring
    document.getElementById('btn-add-meld-toggle').addEventListener('click', () => {
      const optDiv = document.getElementById('add-meld-options');
      optDiv.style.display = optDiv.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('btn-confirm-add').addEventListener('click', () => {
      const selected = [...document.querySelectorAll('#human-hand .card.selected')];
      const ids = selected.map(el => el.dataset.cardId);
      const selEl = document.getElementById('add-meld-target');
      const meldIdx = parseInt(selEl.value, 10);
      if (!isNaN(meldIdx) && ids.length) {
        game.addToExistingMeld(0, meldIdx, ids);
      }
    });

    // Discard buy modal buttons wiring
    document.getElementById('btn-discard-buy-yes').addEventListener('click', () => {
      hideDiscardBuyOverlay();
      if (game.discardBuyerPromptIndex >= 0) {
        const ok = game.buyDiscard(game.discardBuyerPromptIndex);
        if (ok) {
          showToast(`${game.players[game.discardBuyerPromptIndex].name} bought the discard.`);
        } else {
          // Could not buy — skip to next player / end rotation
          game.advanceBuyDiscardPrompt();
        }
      }
    });

    document.getElementById('btn-discard-buy-no').addEventListener('click', () => {
      hideDiscardBuyOverlay();
      game.advanceBuyDiscardPrompt();
    });

    // Play Again wiring: show the new-game overlay, keeping current name
    document.getElementById('btn-play-again').addEventListener('click', () => {
      hideGameOver();
      game.reset();
      renderBoard(game);
      setTimeout(() => showNewGameOverlay(), 200);
    });

    // Sort buttons wiring
    let activeSortBtn = null;

    function clearSortButtons() {
      document.querySelectorAll('#sort-controls .btn-sort-active').forEach(el => el.classList.remove('btn-sort-active'));
      activeSortBtn = null;
    }

    document.getElementById('btn-sort-suit').addEventListener('click', () => {
      // Step 1: deselect all cards before any sort state change
      document.querySelectorAll('#human-hand .card.selected').forEach(el => el.classList.remove('selected'));
      clearSortButtons();
      if (currentSortMode === 'suit') {
        currentSortMode = null;
        document.getElementById('sort-controls').classList.remove('active-sort');
        return;
      }
      activeSortBtn = document.getElementById('btn-sort-suit');
      currentSortMode = 'suit';
      document.getElementById('sort-controls').classList.add('active-sort');
      activeSortBtn.classList.add('btn-sort-active');
      renderBoard(game);
    });

    document.getElementById('btn-sort-rank').addEventListener('click', () => {
      // Step 1: deselect all cards before any sort state change
      document.querySelectorAll('#human-hand .card.selected').forEach(el => el.classList.remove('selected'));
      clearSortButtons();
      if (currentSortMode === 'rank') {
        currentSortMode = null;
        document.getElementById('sort-controls').classList.remove('active-sort');
        return;
      }
      activeSortBtn = document.getElementById('btn-sort-rank');
      currentSortMode = 'rank';
      document.getElementById('sort-controls').classList.add('active-sort');
      activeSortBtn.classList.add('btn-sort-active');
      renderBoard(game);
    });

    // --- Helper functions for discard-buy-modal ---
    function showDiscardBuyOverlay() {
      const overlay = document.getElementById('discard-buy-overlay');
      if (!overlay) return;
      const promptIdx = game.discardBuyerPromptIndex;
      if (promptIdx < 0 || promptIdx >= game.players.length) return;
      const player = game.players[promptIdx];
      
      // If this is an AI player, decide automatically via timeout for UX
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
      
      // For human player, show the modal
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

    function hideDiscardBuyOverlay() {
      const overlay = document.getElementById('discard-buy-overlay');
      if (overlay) overlay.style.display = 'none';
    }

    // Local UI wrapper for buyDiscard prompt advancement
    

    function onStateChanged() {
      renderBoard(game);
      if (game.state === 'dealover') {
        // Auto-advance to next deal after a short delay for UX
        setTimeout(() => {
          if (game.state !== 'dealover') return;
          game.advanceDeal();
          renderBoard(game);
        }, 1500);
      } else if (game.state === 'gameover') {
        hideGameOver();
        setTimeout(() => renderGameOver(), 100);
      } else if (game.state === 'buyDiscard') {
        // Show the discard-buy modal for the current promptee
        showDiscardBuyOverlay();
      }
    }

    // Attach state change handler to Game instance
    game.messagesOut.onStateChanged = onStateChanged;
  }

  // -- New Game: confirm button (wired after initUI so it always exists regardless of DOM timing) --
  function onNewGameConfirm() {
    const input = document.getElementById('player-name-input');
    const name = (input ? input.value : '') || 'Player 1';
    game.playerName = name.trim() || 'Player 1';
    game.players[0].name = game.playerName;
    const overlay = document.getElementById('new-game-overlay');
    if (overlay) overlay.style.display = 'none';
    renderBoard(game);
    setTimeout(() => {
      game.startGame();
    }, 300);
  }

  // Wire the game buttons + the new-game overlay confirm button after DOM is ready
  function onGameReady() {
    const btn = document.getElementById('btn-confirm-new-game');
    if (btn) {
      btn.addEventListener('click', onNewGameConfirm);
    }
    const input = document.getElementById('player-name-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onNewGameConfirm();
      });
    }

    // Now wire all game button listeners inside initUI
    const defaultName = (input?.value?.trim()) || 'Player 1';
    game = new Game(defaultName);
    initUI();
  }

  if (document.readyState !== 'loading') onGameReady();
  else document.addEventListener('DOMContentLoaded', onGameReady);

}
