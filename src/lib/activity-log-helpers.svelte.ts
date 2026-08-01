import type { ActionEventType } from '../game/activity-log/log-manager.js';

export const EVENT_ACTION_CLASS_MAP: Record<ActionEventType, string> = {
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

export function getActionClassFromString(action: string): string {
  if (action.includes('New Game')) return EVENT_ACTION_CLASS_MAP.NewGame;
  if (action === 'Game Over') return EVENT_ACTION_CLASS_MAP.GameOver;
  if (action.startsWith('Started Turn') || action === 'Dealt Cards') return EVENT_ACTION_CLASS_MAP.DrawStock;
  if (action.startsWith('Played Set') || action.startsWith('Played Run')) return EVENT_ACTION_CLASS_MAP.PlayMeldSet;
  if (action === 'Add to Meld') return EVENT_ACTION_CLASS_MAP.AddToMeld;
  if (action === 'Bought Card') return EVENT_ACTION_CLASS_MAP.BuyDiscard;
  if (action.startsWith('Discarded') || action === 'Discard') return EVENT_ACTION_CLASS_MAP.Discard;
  return '';
}
