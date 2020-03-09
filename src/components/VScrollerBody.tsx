import React, {
  FunctionComponent,
  ReactNode,
  cloneElement,
  ReactElement,
  isValidElement,
  memo
} from "react";
import { useVScrollerState } from "./VScrollerContext";
import { VScrollerItem } from "./VScrollerItem";

type Renderer = (index: number) => ReactNode;
type VScrollerBodyProps = {
  children: ReactNode | Renderer;
};

const indices = (start: number, end: number): number[] => {
  return [...Array(end - start)].map((_, i) => i + start);
};

export const VScrollerBody: FunctionComponent<VScrollerBodyProps> = (props: VScrollerBodyProps) => {
  const { range, timestamp } = useVScrollerState();
  return <MemoizedBody {...range} timestamp={timestamp} {...props} />;
};

type MemoizedBodyProps = VScrollerBodyProps & {
  start: number;
  end: number;
  more: boolean;
  timestamp: number;
};

const MemoizedBody = memo<MemoizedBodyProps>(
  ({ start, end, more, children }) => {
    if (typeof children === "function") {
      // TODO: ideally we'd be keying off of something other than index -
      // need to determine how to cleanly do that...
      return (
        <>
          {indices(start, end).map(index => (
            <VScrollerItem key={index} index={index}>
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
  (a, b) =>
    a.start === b.start && a.end === b.end && a.more === b.more && a.timestamp === b.timestamp
);
MemoizedBody.displayName = "MemoizedBody";
