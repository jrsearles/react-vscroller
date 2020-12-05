import React, {
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
  ReactElement,
  useMemo,
  PropsWithChildren,
  memo
} from "react";
import { waitForScrollToStop } from "../dom";
import { ItemSizeCache } from "../ItemSizeCache";
import { DynamicRowStrategy } from "../DynamicRowStrategy";
import { Range, VScrollerProps, VScrollerState } from "../VScroller.types";
import { useHandler } from "./use-handler";
import { VScrollerHead } from "./VScrollerHead";
import { VScrollerBody } from "./VScrollerBody";
import { VScrollerFoot } from "./VScrollerFoot";
import { VScrollerItem } from "./VScrollerItem";
import { VScrollerContext } from "./VScrollerContext";
import { Viewport } from "../Viewport";
import * as styles from "../styles";

export interface IVScrollerContainer {
  (props: PropsWithChildren<VScrollerProps>): ReactElement | null;
}

export interface IVScroller extends IVScrollerContainer {
  Head: typeof VScrollerHead;
  Body: typeof VScrollerBody;
  Foot: typeof VScrollerFoot;
  Item: typeof VScrollerItem;
}

const adjustFillers = (current: VScrollerState): VScrollerState => {
  const { sizes, range, count } = current;
  let { top, bottom } = sizes.offsets(range, count);

  if (range.start > 0) {
    top += current.offsets[0];
  }

  if (range.more) {
    bottom += current.offsets[1];
  }

  if (top === current.top && bottom === current.bottom) {
    return current;
  }

  return { ...current, top, bottom };
};

const rangeFromStart = (start: number, size: number, count: number): Range => {
  const end = Math.min(start + size, count);
  return { start, end, more: end < count };
};

const adjustPageSize = (
  current: VScrollerState,
  viewport: Viewport,
  threshold: number
): VScrollerState => {
  if (current.count <= current.size) {
    return current;
  }

  const { sizes, range, count } = current;
  const renderHeight = sizes.calc(range);
  const windowHeight = viewport.height + threshold * 2; // account for threshold as well

  if (renderHeight > 0 && renderHeight < windowHeight) {
    const renderCount = range.end - range.start;
    const size = Math.ceil(windowHeight / (renderHeight / renderCount));
    return { ...current, size, range: rangeFromStart(range.start, size, count) };
  }

  return current;
};

const MemoizedVScroller: IVScrollerContainer = memo<PropsWithChildren<VScrollerProps>>(
  (props) => {
    const {
      pageSize = 100,
      threshold = 300,
      count,
      onRangeChanged,
      fillerStyle,
      updateSignal,
      children
    } = props;

    const topRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const ref = useRef<HTMLDivElement>(null);
    const viewport = useMemo(() => new Viewport(topRef), []);

    const [state, setState] = useState<VScrollerState>(() => ({
      top: 0,
      bottom: 0,
      scrollTop: null,
      size: pageSize,
      range: rangeFromStart(0, pageSize, count),
      offsets: [0, 0],
      sizes: new ItemSizeCache(count),
      count,
      timestamp: Date.now()
    }));

    const { range, top, bottom, sizes } = state;

    // useEffect(() => {
    //   if (state.scrollTop != null) {
    //     // Keep scroll position in sync with top when a render is triggered.
    //     // This will help prevent content from appearing to jump when a new
    //     // block is rendered
    //     viewport.scrollTop = state.scrollTop;

    //     // We are mutating state to avoid altering the scrollTop if we don't need to
    //     // during rerenders caused by outside influences.
    //     state.scrollTop = null;
    //   }
    // }, [viewport, state.scrollTop]);

    const rangeChangeHandler = useHandler<Range>(onRangeChanged);
    useEffect(() => void rangeChangeHandler(range), [rangeChangeHandler, range]);

    // Main logic for detected when virtual area is entering viewport
    useEffect(() => {
      let mounted = true;
      const strategy = new DynamicRowStrategy(topRef.current!, viewport, threshold);

      const update = () => {
        setState((s) => (mounted ? adjustFillers(strategy.update(s)) : s));
      };

      // Note that rootMargin doesn't work as expected when the component is within an iframe,
      // which means the threshold will not be respected. I suspect there is a workaround here,
      // but i haven't found it if so.
      // see: https://github.com/w3c/IntersectionObserver/issues/283
      const root = viewport.element === document.body ? null : viewport.element;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            update();
          }
        },
        { root, rootMargin: `${threshold}px 0px` }
      );

      observer.observe(bottomRef.current!);
      observer.observe(topRef.current!);

      const dragObserver = new IntersectionObserver(
        (entries) => {
          // We're watching the rendered portion here - if this leaves the screen
          // either the element has scrolled off the screen OR the user is dragging
          // the scrollbar in a way that takes the current batch off the screen
          // before it renders.
          if (entries.some((e) => !e.isIntersecting)) {
            waitForScrollToStop(topRef.current!).then(update);
          }
        },
        { root }
      );

      dragObserver.observe(ref.current!);

      return () => {
        mounted = false;
        observer.disconnect();
        dragObserver.disconnect();
      };
    }, [threshold, viewport]);

    // Handle viewport resizes - when the viewport is resized we may need to
    // recalculate the filler elements
    useEffect(() => {
      let mounted = true;
      let lastHeight = viewport.height;

      const cleanup = viewport.onResize(() => {
        if (viewport.height === lastHeight) {
          return;
        }

        lastHeight = viewport.height;
        setState((s) => {
          if (!mounted) {
            return s;
          }

          s.sizes.reset(s.range);
          return adjustFillers(s);
        });
      });

      return () => {
        mounted = false;
        cleanup();
      };
    }, [viewport, sizes]);

    // Update when new data - reset size cache and adjust range if needed
    useEffect(() => {
      setState((s) => {
        const { size, sizes } = s;

        sizes.resize(count);

        const start = Math.max(0, Math.min(s.range.start, count - size));
        return adjustFillers({
          ...s,
          count,
          range: rangeFromStart(start, size, count),
          timestamp: Date.now()
        });
      });
    }, [count, updateSignal]);

    useLayoutEffect(() => {
      setState(adjustFillers);
    }, [range]);

    // On every render, make sure that enough records are rendered to fill the
    // screen - otherwise adjust the page size accordingly
    useEffect(() => {
      setState((s) => adjustPageSize(s, viewport, threshold));
    });

    return (
      <div style={styles.container}>
        <div style={{ ...fillerStyle, height: top }} ref={topRef} />
        <div style={styles.container} ref={ref}>
          <VScrollerContext.Provider value={state}>{children}</VScrollerContext.Provider>
        </div>
        <div style={{ ...fillerStyle, height: bottom }} ref={bottomRef} />
      </div>
    );
  },
  (a, b) => a.updateSignal === b.updateSignal && a.count === b.count
);

const VScroller = MemoizedVScroller as IVScroller;
VScroller.Head = VScrollerHead;
VScroller.Body = VScrollerBody;
VScroller.Foot = VScrollerFoot;
VScroller.Item = VScrollerItem;
export { VScroller };
