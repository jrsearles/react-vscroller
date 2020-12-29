import React, { FC, useState, ReactElement, useCallback } from "react";
import { useVScrollerState } from "./VScrollerContext";
import { Resizer } from "./Resizer";

type VScrollerFootProps = {
  /** The height of the footer, if known and fixed */
  height?: number;
};

export const VScrollerFoot: FC<VScrollerFootProps> = ({ height, children }) => {
  const { offsets, range } = useVScrollerState();
  const [measured, setMeasured] = useState(false);

  const handleResize = useCallback(
    (e: DOMRectReadOnly) => {
      offsets[1] = e.height;
      setMeasured(true);
    },
    [offsets]
  );

  if (height) {
    offsets[1] = height;
    return children as ReactElement;
  }

  // If there are more items to render, we know we don't need to render
  // the footer - however we do want to render it initially to get a
  // measurement. If there are more items, this should be outside of
  // the viewport so it *shouldn't* have any user impact.
  if (range.more && measured) {
    return null;
  }

  return <Resizer onResize={handleResize}>{children}</Resizer>;
};
