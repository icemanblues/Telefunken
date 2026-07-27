import type { Card } from './card.js';

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
