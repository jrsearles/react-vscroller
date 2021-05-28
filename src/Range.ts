export class Range {
  public readonly start: number;
  public readonly end: number;
  public readonly more: boolean;

  constructor(start: number, size: number, count: number) {
    this.start = start;
    this.end = Math.min(start + size, count);
    this.more = this.end < count;
  }
}
