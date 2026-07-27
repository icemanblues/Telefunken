import type { Card } from './card.js';

export const SUIT_ORDER: Readonly<Record<string, number>> = { diamonds: 1, clubs: 2, hearts: 3, spades: 4 };

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
