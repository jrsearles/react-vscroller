import React, { FunctionComponent } from "react";
import { useVScrollerState } from "./VScrollerContext";
import { Resizer } from "./Resizer";

type VScrollerItemProps = {
  /** Index of the item being rendered */
  index: number;
};

export const VScrollerItem: FunctionComponent<VScrollerItemProps> = ({ index, children }) => {
  const { sizes } = useVScrollerState();
  return <Resizer onResize={e => sizes.set(index, e.height)}>{children}</Resizer>;
};
