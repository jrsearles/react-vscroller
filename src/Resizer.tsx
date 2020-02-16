import { useRef, useEffect, FunctionComponent, ReactElement } from "react";
import { cloneElementWithRef } from "./utils";

type ResizerProps = {
  onResize: (entries: readonly ResizeObserverEntry[]) => void;
};

export const Resizer: FunctionComponent<ResizerProps> = ({ onResize, children }) => {
  const ref = useRef<HTMLElement>(null);
  const callbackRef = useRef(onResize);

  useEffect(() => void (callbackRef.current = onResize));
  useEffect(() => {
    let disconnected = false;
    const observer = new ResizeObserver(entries => {
      if (disconnected) {
        return;
      }

      // eslint-disable-next-line no-unused-expressions
      callbackRef.current?.(entries);
    });

    observer.observe(ref.current!);

    return () => {
      disconnected = true;
      observer.disconnect();
    };
  }, []);

  return cloneElementWithRef(children, ref) as ReactElement;
};
