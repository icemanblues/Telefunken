import { Card } from './card.js';
import type { MeldType } from './types.js';

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
