import React, {
  useEffect,
  useRef,
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
import { VScrollerHead } from "./VScrollerHead";
import { VScrollerBody } from "./VScrollerBody";
import { VScrollerFoot } from "./VScrollerFoot";
import { VScrollerItem } from "./VScrollerItem";
import { VScrollerContext } from "./VScrollerContext";
import { Viewport } from "../Viewport";
import { useSafeState, useHandler } from "./hooks";
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

const applyFillerAdjustments = (current: VScrollerState): VScrollerState => {
  const { sizes, range } = current;
  let { top, bottom } = sizes.offsets(range);

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
  const { size, sizes, range, count } = current;

  if (count <= size) {
    return current;
  }

  const renderHeight = sizes.calc(range);
  const windowHeight = viewport.height + threshold * 2; // account for threshold as well

  if (renderHeight > 0 && renderHeight < windowHeight) {
    const renderCount = range.end - range.start;
    const size = Math.ceil(windowHeight / (renderHeight / renderCount));
    return {
      ...current,
      size,
      range: rangeFromStart(range.start, size, count),
      timestamp: Date.now()
    };
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

    const [state, setState] = useSafeState<VScrollerState>(() => ({
      top: 0,
      bottom: 0,
      scrollTop: null,
      size: pageSize,
      range: rangeFromStart(0, pageSize, count),
      offsets: [0, 0],
      sizes: new ItemSizeCache(count),
      timestamp: Date.now(),
      count
    }));

    const { range, top, bottom, sizes } = state;

    useEffect(() => {
      if (state.scrollTop != null) {
        console.log("current top:", viewport.scrollTop);
        console.log("new top:", state.scrollTop);

        // Keep scroll position in sync with top when a render is triggered.
        // This will help prevent content from appearing to jump when a new
        // block is rendered
        viewport.scrollTop = state.scrollTop;

        // We are mutating state to avoid altering the scrollTop if we don't need to
        // during rerenders caused by outside influences.
        state.scrollTop = null;
      }
    }, [viewport, state.scrollTop]);

    const rangeChangeHandler = useHandler<Range>(onRangeChanged);
    useEffect(() => void rangeChangeHandler(range), [rangeChangeHandler, range]);

    // Main logic for detecting when virtual area is entering viewport
    useEffect(() => {
      const strategy = new DynamicRowStrategy(topRef.current!, viewport, threshold);

      const update = () => {
        console.log("updating...");
        setState((s) => applyFillerAdjustments(strategy.update(s)));
      };

      console.log("root is document", viewport.root === ((document as unknown) as Element));
      console.log("root is null?", viewport.root == null);

      const observer = new IntersectionObserver(
        (entries) => {
          console.log("observing", entries);
          if (entries.some((e) => e.isIntersecting)) {
            update();
          }
        },
        { root: viewport.root, rootMargin: `${threshold}px 0px` }
      );

      console.log(topRef.current);
      observer.observe(topRef.current!);
      observer.observe(bottomRef.current!);

      const dragObserver = new IntersectionObserver(
        (entries) => {
          // We're watching the rendered portion here - if this leaves the screen
          // either the element has scrolled off the screen OR the user is dragging
          // the scrollbar in a way that takes the current batch off the screen
          // before it renders.
          console.log("filler observed");
          if (entries.some((e) => !e.isIntersecting)) {
            waitForScrollToStop(topRef.current!).then(update);
          }
        },
        { root: viewport.root }
      );

      dragObserver.observe(ref.current!);

      return () => {
        observer.disconnect();
        dragObserver.disconnect();
      };
    }, [threshold, viewport]);

    // Handle viewport resizes - when the viewport is resized we may need to
    // recalculate the filler elements
    useEffect(() => {
      let lastHeight = viewport.height;

      return viewport.onResize(() => {
        if (viewport.height === lastHeight) {
          return;
        }

        lastHeight = viewport.height;
        setState((s) => {
          s.sizes.reset(s.range);
          return applyFillerAdjustments(s);
        });
      });
    }, [viewport, sizes]);

    // Force update when we get new data
    // reset size cache and adjust range if needed
    useEffect(() => {
      setState((s) => {
        const { size, sizes, range } = s;

        sizes.resize(count);
        const start = Math.max(0, Math.min(range.start, count - size));

        return {
          ...s,
          count,
          range: rangeFromStart(start, size, count),
          timestamp: Date.now()
        };
      });
    }, [count, updateSignal]);

    useLayoutEffect(() => {
      setState(applyFillerAdjustments);
    });

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
