import React, { FC, ReactNode, cloneElement, ReactElement, isValidElement, memo } from "react";
import { useVScrollerState } from "./VScrollerContext";
import { VScrollerItem } from "./VScrollerItem";

type Renderer = (index: number) => ReactNode;
type VScrollerBodyProps = {
  children: ReactNode | Renderer;
};

const indices = (start: number, end: number): number[] => {
  return [...Array(end - start)].map((_, i) => i + start);
};

export const VScrollerBody: FC<VScrollerBodyProps> = (props: VScrollerBodyProps) => {
  const { range, timestamp, version } = useVScrollerState();
  return <MemoizedBody {...range} timestamp={timestamp} version={version} {...props} />;
};

type MemoizedBodyProps = VScrollerBodyProps & {
  start: number;
  end: number;
  more: boolean;
  timestamp: number;
  version: number;
};

const MemoizedBody = memo<MemoizedBodyProps>(
  ({ start, end, more, version, children }) => {
    if (typeof children === "function") {
      return (
        <>
          {indices(start, end).map((index) => (
            <VScrollerItem key={`${version}-${index}`} index={index}>
              {(children as Renderer)(index)}
            </VScrollerItem>
          ))}
        </>
      );
    }

    if (isValidElement(children)) {
      return cloneElement(children, { range: { start, end, more } });
    }

    return children as ReactElement;
  },
  (a, b) => a.timestamp === b.timestamp
);
MemoizedBody.displayName = "MemoizedBody";
