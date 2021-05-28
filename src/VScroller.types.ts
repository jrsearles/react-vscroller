import { CSSProperties } from "react";
import { ItemSizeCache } from "./ItemSizeCache";
import { Range } from "./Range";

export type VScrollerProps = {
  /**
   * The number of items to render at once - this will adjust automatically
   * if the amount given does not fill the viewport.
   * @default 100
   */
  pageSize?: number;
  /**
   * The threshold in pixels
   * @default 300
   */
  threshold?: number;
  /**
   * The total count of items to render
   */
  count: number;
  /**
   * A callback which will be executed when a new range is rendered
   */
  onRangeChanged?: (range: Range) => void;
  /**
   * Style which will be applied to the upper and lower filler elements
   */
  fillerStyle?: CSSProperties;
  /**
   * Prop which will trigger an update when changed - this will typically
   * either by an array instance of a timestamp
   */
  updateSignal?: unknown;
};

export type VScrollerState = {
  top: number;
  bottom: number;
  scrollTop: number | null;
  range: Range;
  size: number;
  sizes: ItemSizeCache;
  offsets: [number, number];
  count: number;
  timestamp: number;
  version: number;
};
