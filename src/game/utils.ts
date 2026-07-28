import type { Card } from './card.js';

export const SUIT_ORDER: Readonly<Record<string, number>> = { diamonds: 1, clubs: 2, hearts: 3, spades: 4 };

/** Mulberry32 seeded PRNG - returns a float [0, 1) */
export function createRng(seed: number): () => number {
  let s = seed | 0;
  return (): number => {
    s = (s + 0x6D2B79F5) | 0;
    let t: number = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Parse a seed from an unknown input. Returns a valid uint32 or null if invalid */
export function parseSeed(input?: string | number | null): number | null {
  if (input === undefined || input === null) return null;
  
  let num: number;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const parsed = parseInt(trimmed, 10);
    if (isNaN(parsed)) return null;
    num = Math.abs(Math.floor(parsed));
  } else {
    if (!Number.isFinite(input)) return null;
    num = Math.abs(Math.floor(input));
  }
  
  if (num > 4294967295) num = num % 4294967296;
  return num;
}

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
