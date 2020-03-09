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
    const { y } = this._top.getBoundingClientRect();
    const { count, size, sizes, range } = state;
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

      // Need to recalc top because we are iterating down to render bottom
      // when scrolling up. There is likely some optimizations that can be
      // done to avoid this.
      // top = start > 0 ? sizes.calc(0, start) : 0;
    }

    // If the header isn't being rendered, we need to include
    // it's height in the top filler.
    // top += start > 0 ? offsets[0] : 0;

    const end = Math.min(count, start + size);
    // const bottom = end < count ? sizes.calc(end, count) + offsets[1] : 0;
    this._lastPosition = y;

    return {
      ...state,
      range: { start, end, more: end < count },
      scrollTop: this._viewport.scrollTop
    };
  }
}
