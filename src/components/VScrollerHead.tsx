import React, { FunctionComponent, ReactElement } from "react";
import { useVScrollerState } from "./VScrollerContext";
import { Resizer } from "./Resizer";

type VScrollerHeadProps = {
  /** Indicates that the component will always be in the viewport */
  sticky?: boolean;
};

export const VScrollerHead: FunctionComponent<VScrollerHeadProps> = ({ sticky, children }) => {
  const { offsets, range } = useVScrollerState();

  if (sticky) {
    // Since the sticky element will always be rendering we don't need to account for it's height.
    return children as ReactElement;
  }

  const handleResize = (e: DOMRectReadOnly) => {
    // Note that we are intentionally mutating the state here.
    // This is only needed for reference to adjust the height of the
    // top filler to offset for the header. No need to trigger a
    // render.
    offsets[0] = e.height;
  };

  return range.start === 0 ? <Resizer onResize={handleResize}>{children}</Resizer> : null;
};
