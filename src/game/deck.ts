import { Card } from './card.js';

export class Deck {
  cards: Card[] = [];

  constructor() {
    let idx = 0;
    const suits: Array<'hearts' | 'diamonds' | 'clubs' | 'spades'> = ['hearts', 'diamonds', 'clubs', 'spades'];
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
