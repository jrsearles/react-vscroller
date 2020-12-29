import { Range } from "VScroller.types";

export class ItemSizeCache {
  private readonly _sizes: (number | null)[];
  private _lastAvg = 0;

  constructor(length: number) {
    this._sizes = Array(length);
  }

  get(index: number) {
    return this._sizes[index] || 0;
  }

  set(index: number, value: number) {
    this._lastAvg = 0;
    this._sizes[index] = value;
  }

  avg() {
    if (this._lastAvg) {
      return this._lastAvg;
    }

    // We're intentionally ignoring 0 height rows, though this may not always be the right choice...
    const rows = this._sizes.filter(Boolean);
    if (rows.length === 0) {
      return 0;
    }

    const height = rows.reduce((sum: number, e: number | null) => sum + (e || 0), 0);
    return (this._lastAvg = height / rows.length);
  }

  calc(range: Range): number;
  calc(start: number, end: number): number;
  calc(range: Range | number, rangeEnd?: number) {
    const start = typeof range === "number" ? range : range.start;
    const end = typeof range !== "object" ? rangeEnd! : range.end;

    if (end > this._sizes.length) {
      this._sizes.length = end;
    }

    // Since sizes can be a sparse array we need to manually iterate
    let height = 0;
    for (let i = start; i < end; i++) {
      height += this._sizes[i] || this.avg();
    }

    return Math.ceil(height);
  }

  offsets(range: Range) {
    const top = this.calc(0, range.start);
    const bottom = this.calc(range.end, this._sizes.length);
    return { top, bottom };
  }

  reset(rangeToKeep?: Range) {
    if (rangeToKeep) {
      this._lastAvg = 0;
    }

    for (let i = 0; i < this._sizes.length; i++) {
      // Clear anything that is not currently rendered
      if (!rangeToKeep || i < rangeToKeep.start || i >= rangeToKeep.end) {
        this._sizes[i] = null;
      }
    }
  }

  resize(length: number) {
    if (this._sizes.length !== length) {
      this._sizes.length = length;
    }

    this.reset();
  }
}
