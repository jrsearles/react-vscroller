import React, { FunctionComponent } from "react";
import { useVGridState } from "./VGridContext";
import { Resizer } from "./Resizer";

export const VGridHead: FunctionComponent = ({ children }) => {
  const state = useVGridState();

  const handleResize = (entries: readonly ResizeObserverEntry[]) => {
    // Note that we are intentionally mutating the state here.
    // This is only needed for reference when the items are nearing
    // the edge of the viewport. No need to trigger a rerender.
    const top = Math.min(...entries.map(e => e.contentRect.top));
    const bottom = Math.max(...entries.map(e => e.contentRect.bottom));
    state.offsets[0] = bottom - top;
  };

  return <Resizer onResize={handleResize}>{children}</Resizer>;
};
