export const SUITS = ['hearts' as const, 'diamonds' as const, 'clubs' as const, 'spades' as const];
export type Suit = (typeof SUITS)[number] | 'joker';

export const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
  joker: String.fromCodePoint(0x1f0cf),
};

export const RANK_LABELS: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

export const RANK_POINT_VALUES: Record<number, number> = {
  2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
  10: 10, 11: 10, 12: 10, 13: 10, 14: 15,
};

export const WILD_RANK = 'joker' as const;

export function isSuitRed(suit: string): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}
