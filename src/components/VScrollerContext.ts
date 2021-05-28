import { createContext, useContext } from "react";
import { ItemSizeCache } from "../ItemSizeCache";
import { VScrollerState } from "../VScroller.types";

export const VScrollerContext = createContext<VScrollerState>({
  top: 0,
  bottom: 0,
  range: { start: 0, end: 0, more: false },
  size: 100,
  sizes: new ItemSizeCache(0),
  offsets: [0, 0],
  count: 0,
  scrollTop: null,
  timestamp: 0,
  version: 0
});
VScrollerContext.displayName = "VScrollerContext";

export const useVScrollerState = () => useContext(VScrollerContext);
