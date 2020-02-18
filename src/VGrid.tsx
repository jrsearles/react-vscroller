import React, {
  useEffect,
  useRef,
  useState,
  MutableRefObject,
  FunctionComponent,
  RefObject,
  useLayoutEffect,
  CSSProperties
} from "react";
import { VGridContext, SizeCacheEntry, GridRenderContext, Range } from "./VGridContext";
import { getScrollParent } from "./utils";
import { useLatest } from "./use-latest";
import * as styles from "./styles";

const initialState = {
  top: 0,
  bottom: 0,
  scrollTop: undefined
};

const getRowSize = (entry: SizeCacheEntry): number => {
  return typeof entry === "function" ? entry() : entry || 0;
};

const getAverageRowSize = ({ sizes }: GridRenderContext) => {
  // We're intentialy ignoring 0 height rows, though this may not always be the right choice...
  const rows = sizes.filter(Boolean);
  if (rows.length === 0) {
    return 0;
  }

  const height = rows.reduce((sum: number, h: SizeCacheEntry) => sum + getRowSize(h), 0);
  return height / rows.length;
};

const getRenderHeight = (sizes: SizeCacheEntry[], start: number, end: number, avg = 0) => {
  // Since sizes can be a sparse array we need to manually iterate
  let height = 0;
  for (let i = start; i < end; i++) {
    height += getRowSize(sizes[i]) || avg;
  }
  return height;
};

const findScrollParent = (
  scrollerRef: RefObject<HTMLElement | null>,
  elRef: RefObject<HTMLDivElement | null>
) => {
  return (
    scrollerRef.current ||
    ((scrollerRef as MutableRefObject<HTMLElement>).current = getScrollParent(elRef.current!))
  );
};

const getScreenDimensions = (scroller: HTMLElement) => {
  if (scroller === document.body) {
    return {
      windowHeight: window.innerHeight,
      scrollTop: document.documentElement.scrollTop ?? document.body.scrollTop
    };
  }

  return {
    windowHeight: scroller.scrollHeight,
    scrollTop: scroller.scrollTop
  };
};

type VGridProps = {
  minSize?: number;
  threshold?: number;
  count: number;
  onRangeChanged?: (range: Range) => void;
  fillerStyle?: CSSProperties;
};

export const VGrid: FunctionComponent<VGridProps> = ({
  minSize = 100,
  threshold = 200,
  count,
  onRangeChanged,
  fillerStyle,
  children
}) => {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLElement>(null);
  const handleRangeChanged = useLatest(onRangeChanged);

  const [state, setState] = useState<GridRenderContext>(() => ({
    ...initialState,
    size: minSize,
    range: { start: 0, end: Math.min(minSize, count) },
    offsets: [],
    sizes: Array(count),
    count
  }));

  console.log(state);

  const { size, top = 0, bottom = 0 } = state;

  useEffect(() => void handleRangeChanged.current?.(state.range), [state.range]);

  useLayoutEffect(() => {
    if (state.scrollTop != null) {
      // Keep scroll position in sync with top when a render is triggered.
      // This will help prevent content from appearing to jump when a new
      // block is rendered
      document.documentElement.scrollTop = document.body.scrollTop = state.scrollTop;
      // We are mutating state to avoid altering the scrollTop if we don't need to.
      state.scrollTop = null;
    }
  }, [state]);

  useEffect(() => {
    // We will accept changes to prop if they get larger, but not smaller.
    // It might be better to just use the initial value and ignore changes though...
    const renderSize = Math.max(size, minSize);

    // This will run during the initial render and will determine the size of the bottom filler,
    // which will make sure the scrollbar reflects the entire space of virtualized component. This
    // will be an approximate height, but we can improve the accuracy as more records are rendered.
    setState(o => {
      if (count <= renderSize) {
        // Too small to virtualize - everything will be rendered
        return { ...o, range: { start: 0, end: count }, top: 0, bottom: 0, size: renderSize };
      }

      if (o.range.start > 0 && o.size === renderSize) {
        // No need to change
        return o;
      }

      const scroller = findScrollParent(scrollerRef, ref);
      const { windowHeight } = getScreenDimensions(scroller);
      const renderHeight = getRenderHeight(o.sizes, o.range.start, o.range.end);

      if (renderHeight < windowHeight && renderSize === o.size) {
        // Content is not tall enough - need to increase size. We could be smarter about this by looking
        // at the current row height and just appending enough to fill the screen, but this is simpler
        // and should be effective - this will continue to double size until enough is shown.
        return { ...o, size: renderSize * 2 };
      }

      const rowHeight = getAverageRowSize(o);
      const bottom = Math.ceil(rowHeight * (count - renderSize));

      return {
        ...o,
        top: 0,
        bottom,
        size: renderSize
      };
    });
  }, [size, minSize, count]);

  useEffect(() => {
    let disconnected = false;
    const scroller = findScrollParent(scrollerRef, ref);
    // Note that rootMargin doesn't work as expected when the component is within an iframe,
    // which means the threshold will not be respected. I suspect there is a workaround here,
    // but i haven't found it if so.
    // see: https://github.com/w3c/IntersectionObserver/issues/283
    const root = scroller === document.body ? null : scroller;
    let { y: position } = topRef.current!.getBoundingClientRect();

    const calculate = () => {
      setState(o => {
        const { y } = topRef.current!.getBoundingClientRect();
        if (y === position) {
          return o;
        }

        const { scrollTop, windowHeight } = getScreenDimensions(scrollerRef.current!);
        const avgRowHeight = getAverageRowSize(o);
        let start = 0;
        let top = 0;

        const down = y < position;
        const targetHeight = down ? -y - threshold : -y + windowHeight + threshold;
        let index = 0;

        // while (index < o.count - o.size) {
        //   const rowHeight = getRowSize(o.sizes[index]) || avgRowHeight;
        //   if (top + rowHeight > targetHeight) {
        //     break;
        //   }

        //   top += rowHeight;
        //   index++;
        // }

        // if (down) {
        //   start = index;
        // } else {
        //   start = index - o.size;
        // }

        if (y < position) {
          while (start < o.count - o.size) {
            const rowHeight = getRowSize(o.sizes[start]) || avgRowHeight;
            if (top + rowHeight > -y - threshold) {
              break;
            }

            top += rowHeight;
            start++;
          }
        } else {
          while (start < o.count - o.size) {
            const rowHeight = getRowSize(o.sizes[start]) || avgRowHeight;
            if (top + rowHeight > -y + windowHeight + threshold) {
              break;
            }

            top += rowHeight;
            start++;
          }

          start -= o.size;
          top = start > 0 ? getRenderHeight(o.sizes, 0, start, avgRowHeight) : 0;
        }

        start = Math.max(0, start);
        const end = Math.min(o.count, start + o.size);
        const bottom = end < o.count ? getRenderHeight(o.sizes, end, count, avgRowHeight) : 0;
        position = y;

        return {
          ...o,
          range: { start, end },
          top,
          bottom,
          scrollTop
        };
      });
    };

    const observer = new IntersectionObserver(
      entries => {
        console.log(entries);
        if (!disconnected && entries.some(e => e.isIntersecting)) {
          calculate();
        }
      },
      { root, rootMargin: `${threshold}px` }
    );

    observer.observe(bottomRef.current!);
    observer.observe(topRef.current!);

    let handle: number;
    const waitForScrollToStop = () => {
      const { y } = topRef.current!.getBoundingClientRect();
      handle = requestAnimationFrame(() => {
        const { y: newY } = topRef.current!.getBoundingClientRect();
        if (y === newY) {
          calculate();
        } else {
          waitForScrollToStop();
        }
      });
    };

    const dragObserver = new IntersectionObserver(entries => {
      if (!disconnected && entries.some(e => !e.isIntersecting)) {
        waitForScrollToStop();
      }
    });

    dragObserver.observe(ref.current!);

    return () => {
      disconnected = true;
      cancelAnimationFrame(handle);
      observer.disconnect();
    };
  }, [threshold]);

  return (
    <div style={styles.container}>
      <div style={{ ...fillerStyle, height: top }} ref={topRef} />
      <div style={styles.body} ref={ref}>
        <VGridContext.Provider value={state}>{children}</VGridContext.Provider>
      </div>
      <div style={{ ...fillerStyle, height: bottom }} ref={bottomRef} />
    </div>
  );
};
