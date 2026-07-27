export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
export type CardRank = number | 'joker';
export type MeldType = 'set' | 'run';
export type GameState = 'init' | 'discard' | 'draw' | 'meld' | 'buyDiscard' | 'dealover' | 'gameover';
export interface Contract { count: number; minSize: number; }

export interface StateEvent {
  dealNumber?: number;
  phase?: GameState;
  currentPlayerIndex?: number;
  [key: string]: unknown;
}

export interface MessagesOut {
  onStateChanged?: (event: StateEvent) => void;
  onMessage?: (msg: string) => void;
  delay?: () => void;
}
