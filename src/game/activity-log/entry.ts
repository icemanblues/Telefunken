export class ActionLogEntry {
  player: string;
  dealNumber: number;
  action: string;
  detail: string;
  timestamp: number;

  constructor(player: string, dealNumber: number, actionName: string, detail: string = '') {
    this.player = player;
    this.dealNumber = dealNumber;
    this.action = actionName;
    this.detail = detail;
    this.timestamp = Date.now();
  }
}
