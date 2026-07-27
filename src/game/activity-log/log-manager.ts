import { ActionLogEntry } from './entry.js';

export type ActionEventType = 'NewGame' | 'StartDeal' | 'DrawStock' | 'BuyDiscard'
  | 'PlayMeldSet' | 'PlayMeldRun' | 'AddToMeld' | 'Discard' | 'WentOut' | 'GameOver';

const EVENT_LABELS: Record<ActionEventType, string> = {
  NewGame: 'New Game',
  StartDeal: 'Dealt Cards',
  DrawStock: 'Started Turn',
  BuyDiscard: 'Bought Card',
  PlayMeldSet: 'Played Set',
  PlayMeldRun: 'Played Run',
  AddToMeld: 'Add to Meld',
  Discard: 'Discarded',
  WentOut: 'Discarded',
  GameOver: 'Game Over',
};

const EVENT_ACTION_CLASS_MAP: Record<ActionEventType, string> = {
  NewGame: 'action-new',
  StartDeal: 'action-draw',
  DrawStock: 'action-draw',
  BuyDiscard: 'action-buy',
  PlayMeldSet: 'action-meld',
  PlayMeldRun: 'action-meld',
  AddToMeld: 'action-add',
  Discard: 'action-discard',
  WentOut: 'action-discard',
  GameOver: 'action-over',
};

export class ActivityLog {
  entries: ActionLogEntry[] = [];
  readonly MAX_ENTRIES = 200;

  push(eventType: ActionEventType, player: string, dealNumber: number, detail: string): ActionLogEntry {
    const actionLabel = EVENT_LABELS[eventType];
    const entry = new ActionLogEntry(player, dealNumber, actionLabel, detail);
    this.entries.push(entry);
    if (this.entries.length > this.MAX_ENTRIES) {
      this.entries.shift();
    }
    return entry;
  }

  clear(): void {
    this.entries = [];
  }

  getEventLabel(eventType: ActionEventType): string {
    return EVENT_LABELS[eventType];
  }

  static getActionCardClass(eventType: ActionEventType): string {
    return EVENT_ACTION_CLASS_MAP[eventType];
  }
}
