import type { Card } from '../card.js';
import type { MeldType } from '../types.js';

export interface AIMeld { type: MeldType; cardIds: string[]; }

export function forwardRankDistance(a: number, b: number): number {
  const posA = ((a - 2) % 13 + 13) % 13;
  const posB = ((b - 2) % 13 + 13) % 13;
  return (posB - posA + 13) % 13;
}

export function countWildsForRun(naturals: readonly Card[]): number {
  if (naturals.length < 2) return Infinity;
  let wilds = 0;
  for (let i = 1; i < naturals.length; i++) {
    const a = naturals[i - 1].rank;
    const b = naturals[i].rank;
    if (typeof a !== 'number' || typeof b !== 'number') return Infinity;
    const gap = forwardRankDistance(a, b);
    if (gap > 2) return Infinity;
    wilds += Math.max(0, gap - 1);
  }
  return wilds;
}

export function isConsequencePossible(naturals: readonly Card[], maxWilds: number): boolean {
  const needed = countWildsForRun(naturals);
  return needed <= maxWilds && (naturals.length + Math.min(needed, maxWilds)) >= 3;
}

export function evaluateMelds(handIds: string[], allCards: Record<string, Card>, dealNumber?: number): Array<AIMeld> {
  const result: Array<AIMeld> = [];
  const naturals = handIds.map(id => allCards[id]).filter(Boolean) as Card[];

  const rankGroups: Record<number, Card[]> = {};
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

  const remainingNaturals = naturals.filter(c => !meldedIds.has(c.id));
  if (!remainingNaturals.length) return result;

  const suitGroups: Record<string, Card[]> = {};
  for (const c of remainingNaturals) {
    if (c.isJoker || typeof c.rank !== 'number') continue;
    if (!suitGroups[c.suit]) suitGroups[c.suit] = [];
    suitGroups[c.suit].push(c);
  }

  let sharedJokerPool = 0;
  for (const id of handIds) {
    const c = allCards[id];
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
        const gap = forwardRankDistance(lastRankNum, rankNum);
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

      const wildNeeded = countWildsForRun(currentRun);
      if ((currentRun.length + wildNeeded) >= 3 && wildNeeded <= currentRun.length) {
        result.push({ type: 'run', cardIds: currentRun.map(c => c.id) });
        for (const c of currentRun) meldedIds.add(c.id);
      }
    }
  }

  return result;
}

export function aiDiscardSelection(playerHandIds: string[], allCards: Record<string, Card>, melds: AIMeld[]): string | null {
  const meldableIds = new Set<string>();
  for (const m of melds) {
    for (const id of m.cardIds) meldableIds.add(id);
  }

  let worstCardId: string | null = null;
  let worstScore = -1;
  for (const id of playerHandIds) {
    const card = allCards[id];
    if (!card) continue;
    const score = meldableIds.has(id) ? 0 : card.pointValue;
    if (score > worstScore || worstCardId === null) {
      worstScore = score;
      worstCardId = id;
    }
  }

  return worstCardId;
}

export function wantsDiscard(fromPlayerHand: readonly Card[], topCard: Card): boolean {
  if (topCard.isJoker || typeof topCard.rank !== 'number') return false;
  const matchingCards = fromPlayerHand.filter(c => !c.isJoker && typeof c.rank === 'number' && c.rank === topCard.rank);
  return matchingCards.length >= 2;
}

export function chooseDrawSource(wantsDiscard: boolean, hasChips: boolean, state: string): 'stock' | 'discard' {
  if (wantsDiscard && hasChips) return 'discard';
  return 'stock';
}

import { Player } from '../players/player.js';

export function advanceBuyDiscardPrompt(players: Player[], discarderIdx: number, promptIdx: number): { newIndex: number | null; allDeclined: boolean } {
  let nextIdx = (promptIdx + 1) % 4;
  let loops = 0;
  while (nextIdx !== discarderIdx && loops < 4) {
    const p = players[nextIdx];
    if (p.chips > 0 && !p.hasMelded) break;
    nextIdx = (nextIdx + 1) % 4;
    loops++;
  }

  if (nextIdx === discarderIdx || loops >= 4) {
    return { newIndex: null, allDeclined: true };
  }
  return { newIndex: nextIdx, allDeclined: false };
}
