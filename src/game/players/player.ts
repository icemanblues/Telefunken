export class Player {
  id: number;
  name: string;
  isHuman: boolean;
  hand: string[] = [];
  chips: number = 6;
  score: number = 0;
  hasMelded: boolean = false;

  constructor(id: number, name?: string) {
    this.id = id;
    this.name = name ?? (id === 0 ? 'You' : `CPU ${id}`);
    this.isHuman = id === 0;
  }

  get handCardCount(): number {
    return this.hand.length;
  }
}
