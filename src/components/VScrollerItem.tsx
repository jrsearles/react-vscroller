import React, { FunctionComponent, ReactElement } from "react";
import { useVScrollerState } from "./VScrollerContext";
import { Resizer } from "./Resizer";

type VScrollerItemProps = {
  /** Index of the item being rendered */
  index: number;
  /** The height of the item, if known and fixed */
  height?: number;
};

export const VScrollerItem: FunctionComponent<VScrollerItemProps> = ({
  index,
  height,
  children
}) => {
  const { sizes } = useVScrollerState();

  if (height) {
    sizes.set(index, height);
    return children as ReactElement;
  }

  return <Resizer onResize={(e) => sizes.set(index, e.height)}>{children}</Resizer>;
};
