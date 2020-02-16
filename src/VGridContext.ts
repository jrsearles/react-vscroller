import { createContext, useContext } from "react";

export type SizeReader = () => number;
export type SizeCacheEntry = number | null | SizeReader;
export type Range = { start: number; end: number };

export type GridRenderContext = {
  top: number;
  bottom: number;
  scrollTop?: number | null;
  range: Range;
  size: number;
  sizes: SizeCacheEntry[];
  offsets: [number?, number?];
  count: number;
};

export const VGridContext = createContext<GridRenderContext>({
  top: 0,
  bottom: 0,
  range: { start: 0, end: 0 },
  size: 100,
  sizes: [],
  offsets: [],
  count: 0
});

export const VGridConsumer = VGridContext.Consumer;
export const useVGridState = () => useContext(VGridContext);
