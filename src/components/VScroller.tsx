import React, { useEffect, useRef, ReactElement, useMemo, PropsWithChildren, memo } from "react";
import { waitForScrollToStop } from "../dom";
import { ItemSizeCache } from "../ItemSizeCache";
import { DynamicRowStrategy } from "../DynamicRowStrategy";
import { Range } from "../Range";
import { VScrollerProps, VScrollerState } from "../VScroller.types";
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

const applyFillerAdjustments = (current: VScrollerState) => {
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
    const size = Math.ceil(windowHeight / renderHeight / renderCount);
    return {
      ...current,
      size,
      range: new Range(range.start, size, count),
      timestamp: Date.now()
    };
  }

  return current;
};

const MemoizedVScroller: IVScrollerContainer = memo<PropsWithChildren<VScrollerProps>>(
  function VScroller({
    pageSize = 100,
    threshold = 300,
    count,
    onRangeChanged,
    fillerStyle,
    updateSignal,
    children
  }) {
    const topRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const ref = useRef<HTMLDivElement>(null);
    const viewport = useMemo(() => new Viewport(topRef), []);

    const [state, setState] = useSafeState<VScrollerState>(() => ({
      top: 0,
      bottom: 0,
      scrollTop: null,
      size: pageSize,
      range: new Range(0, pageSize, count),
      offsets: [0, 0],
      sizes: new ItemSizeCache(count),
      timestamp: Date.now(),
      version: 0,
      count
    }));

    const { range, top, bottom } = state;

    useEffect(() => {
      if (state.scrollTop != null) {
        // Keep scroll position in sync with top when a render is triggered.
        // This will help prevent content from appearing to jump when a new
        // block is rendered
        if (Math.abs(viewport.scrollTop - state.scrollTop) >= 1) {
          viewport.scrollTop = state.scrollTop;
          setState((s) => ({ ...s, scrollTop: null }));
        }
      }
    }, [viewport, state.scrollTop]);

    const rangeChangeHandler = useHandler<Range>(onRangeChanged);
    useEffect(() => void rangeChangeHandler(range), [rangeChangeHandler, range]);

    // Main logic for detecting when virtual area is entering viewport
    useEffect(() => {
      const strategy = new DynamicRowStrategy(topRef.current!, viewport, threshold);

      const update = () => {
        setState((s) => applyFillerAdjustments(strategy.update(s)));
      };

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            update();
          }
        },
        { root: viewport.root, rootMargin: `${threshold}px 0px` }
      );

      observer.observe(topRef.current!);
      observer.observe(bottomRef.current!);

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
    }, [viewport]);

    // Force update when we get new data, reset size cache and adjust range if needed
    useEffect(() => {
      setState((s) => {
        const { size, sizes, range } = s;

        sizes.resize(count);
        const start = Math.max(0, Math.min(range.start, count - size));

        return applyFillerAdjustments({
          ...s,
          count,
          range: new Range(start, size, count),
          version: s.version + 1,
          timestamp: Date.now()
        });
      });
    }, [count, updateSignal]);

    // On every render, make sure that enough records are rendered to fill the
    // screen - otherwise adjust the page size accordingly. In practice this should
    // only come into play on initial render.
    useEffect(() => {
      setState((s) => applyFillerAdjustments(adjustPageSize(s, viewport, threshold)));
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
