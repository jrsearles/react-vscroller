import React, { FunctionComponent, useState } from "react";
import { useVScrollerState } from "./VScrollerContext";
import { Resizer } from "./Resizer";

export const VScrollerFoot: FunctionComponent = ({ children }) => {
  const { offsets, range } = useVScrollerState();
  const [measured, setMeasured] = useState(false);

  const handleResize = (e: DOMRectReadOnly) => {
    offsets[1] = e.height;
    setMeasured(true);
  };

  // If there are more items to render, we know we don't need to render
  // the footer - however we do want to render it initially to get a
  // measurement. If there are more items, this should be outside of
  // the viewport so it *shouldn't* have any user impact.
  if (range.more && measured) {
    return null;
  }

  return <Resizer onResize={handleResize}>{children}</Resizer>;
};
