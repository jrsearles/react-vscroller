import { VScrollerState } from "./VScroller.types";
import { Viewport } from "Viewport";

export class DynamicRowStrategy {
  private readonly _top: HTMLDivElement;
  private readonly _viewport: Viewport;
  private readonly _threshold: number;
  private _lastPosition: number;

  constructor(top: HTMLDivElement, viewport: Viewport, threshold: number) {
    this._top = top;
    this._viewport = viewport;
    this._threshold = threshold;
    this._lastPosition = top.getBoundingClientRect().y;
  }

  update(state: VScrollerState): VScrollerState {
    const { count, size, sizes, range } = state;
    const { y } = this._top.getBoundingClientRect();
    const down = y < this._lastPosition;

    // Quick sanity checks
    if (
      y === this._lastPosition ||
      // already at the bottom
      (down && range.end === count) ||
      // already at the top
      (!down && range.start === 0)
    ) {
      this._lastPosition = y;
      return state;
    }

    let start = 0,
      index = 0,
      top = 0;

    const targetHeight = down ? -y - this._threshold : -y + this._viewport.height + this._threshold;
    const limit = down ? count - size : count;

    while (index < limit) {
      const rowHeight = sizes.get(index) || sizes.avg();
      if (top + rowHeight > targetHeight) {
        break;
      }

      top += rowHeight;
      index++;
    }

    if (down) {
      start = index;
    } else {
      start = Math.max(0, index - size);
    }

    const end = Math.min(count, start + size);
    this._lastPosition = y;

    return {
      ...state,
      range: { start, end, more: end < count },
      timestamp: Date.now(),
      scrollTop: this._viewport.scrollTop
    };
  }
}
