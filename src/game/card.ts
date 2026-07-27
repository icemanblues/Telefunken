import type { Suit, CardRank } from './types.js';

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
    if (typeof this.rank !== 'number') return 20;
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
