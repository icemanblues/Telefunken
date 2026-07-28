import type { Card } from '../card.js';
import { Player } from '../players/player.js';

export function scoreDeal(players: Player[], allCards: Record<string, Card>): void {
  for (const player of players) {
    if (player.hand.length === 0) continue;
    let penalty = 0;
    for (const cardId of player.hand) {
      const card = allCards[cardId];
      if (card) penalty += card.pointValue;
    }
    player.score += penalty;
  }
}

export function endGame(players: Player[]): string {
  for (const player of players) {
    player.score -= player.chips * 10;
  }
  const sorted = [...players].sort((a, b) => a.score - b.score);
  return sorted[0]?.name ?? 'TBD';
}

export interface LeaderboardEntry { rank: number; player: Player; penaltyScore: number; chipBonus: number; isActivePlayer: boolean; isDealer: boolean; }

export interface LeaderboardOptions { dealNum?: number; dealerOffset: number; currentPlayerIdx?: number; }

export function getLeaderboard(players: readonly Player[], options?: LeaderboardOptions): LeaderboardEntry[] {
  const sorted = [...players].sort((a, b) => a.score - b.score);
  const dealerIdx = options?.dealNum != null ? (options.dealNum - 1 + options.dealerOffset) % 4 : -1;
  return sorted.map((player, rankIdx) => ({
    rank: rankIdx + 1,
    player,
    penaltyScore: player.score,
    chipBonus: player.chips * 10,
    isActivePlayer: options?.currentPlayerIdx != null && player.id === options.currentPlayerIdx,
    isDealer: dealerIdx >= 0 && player.id === dealerIdx,
  }));
}

export function getWinner(leaderboard: LeaderboardEntry[]): Player | null {
  if (leaderboard.length === 0) return null;
  return leaderboard[0].player;
}
