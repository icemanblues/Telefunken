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

export interface LeaderboardEntry { rank: number; player: Player; penaltyScore: number; chipBonus: number; }

export function getLeaderboard(players: readonly Player[]): LeaderboardEntry[] {
  const sorted = [...players].sort((a, b) => a.score - b.score);
  return sorted.map((player, rankIdx) => ({
    rank: rankIdx + 1, player, penaltyScore: player.score, chipBonus: player.chips * 10,
  }));
}

export function getWinner(leaderboard: LeaderboardEntry[]): Player | null {
  if (leaderboard.length === 0) return null;
  return leaderboard[0].player;
}
