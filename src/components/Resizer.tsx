import { useRef, useEffect, FC } from "react";
import { cloneElementWithRef } from "./clone-element";
import { useHandler } from "./hooks";

type ResizerProps = {
  onResize: (entry: DOMRectReadOnly) => void;
};

const listeners = new Map<Element, (entry: DOMRectReadOnly) => void>();
let observer: ResizeObserver | null = null;

const listen = (element: Element, handler: (entry: DOMRectReadOnly) => void) => {
  observer =
    observer ||
    new ResizeObserver((entries) => {
      entries.forEach((e) => listeners.get(e.target)?.(e.contentRect));
    });

  listeners.set(element, handler);
  observer.observe(element);
  return () => unlisten(element);
};

const unlisten = (element: Element) => {
  listeners.delete(element);
  observer?.unobserve(element);

  if (listeners.size === 0) {
    observer?.disconnect();
    observer = null;
  }
};

export const Resizer: FC<ResizerProps> = ({ onResize, children }) => {
  const ref = useRef<Element>(null);
  const resizeHandler = useHandler(onResize);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      return listen(element, resizeHandler);
    }
  }, [resizeHandler]);

  return cloneElementWithRef(children, ref);
};
