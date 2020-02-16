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
  const height = rows.reduce((sum: number, h: SizeCacheEntry) => sum + getRowSize(h), 0);
  return height / rows.length;
};

const getRenderHeight = ({ sizes, range }: GridRenderContext) => {
  return sizes
    .slice(range.start, range.end)
    .reduce((sum: number, h: SizeCacheEntry) => sum + getRowSize(h), 0);
};

const getScrollParentFromRef = (
  scrollerRef: RefObject<HTMLElement | null>,
  elRef: RefObject<HTMLDivElement | null>
) => {
  return (
    scrollerRef.current ||
    ((scrollerRef as MutableRefObject<HTMLElement>).current = getScrollParent(elRef.current!))
  );
};

const getDimensions = (scroller: HTMLElement) => {
  if (scroller === document.body) {
    const height = window.innerHeight;
    const scrollTop = document.documentElement.scrollTop ?? document.body.scrollTop;
    return {
      height,
      scrollTop,
      scrollBottom: scrollTop + height
    };
  }

  const height = scroller.scrollHeight;
  const scrollTop = scroller.scrollTop;
  return {
    height,
    scrollTop,
    scrollBottom: scrollTop + height
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
    sizes: [],
    count
  }));

  console.log(state.range);

  const { size, top = 0, bottom = 0 } = state;

  useEffect(() => void handleRangeChanged.current?.(state.range), [state.range]);

  useLayoutEffect(() => {
    if (state.scrollTop != null) {
      // Keep scroll position in sync with top when a render is triggered.
      // This will help prevent content from appearing to jump when a new
      // block is rendered - we are mutating state to avoid altering the
      // scrollTop if we don't need to.
      document.documentElement.scrollTop = document.body.scrollTop = state.scrollTop;
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

      const scroller = getScrollParentFromRef(scrollerRef, ref);
      const windowHeight = scroller === document.body ? window.innerHeight : scroller.scrollHeight;
      const renderHeight = getRenderHeight(o);

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
    const scroller = getScrollParentFromRef(scrollerRef, ref);
    const root = scroller === document.body ? null : scroller;
    let { y: position } = topRef.current!.getBoundingClientRect();

    const calculate = () => {
      // TODO: handle
      // - scrolling up
      // - scollable containers

      setState(o => {
        const { y } = topRef.current!.getBoundingClientRect();
        if (y === position) {
          return o;
        }

        const dims = getDimensions(scrollerRef.current!);
        console.log("window", dims);

        console.log("y", y);
        const { count, sizes } = o;
        const { top, bottom } = ref.current!.getBoundingClientRect();
        const avgRowHeight = getAverageRowSize(o);
        let jump = -top;

        //   if (o.top + jump === o.scrollTop) {
        //     return o;
        //   }

        //   if (o.top + jump < o.scrollTop) {
        //     //            console.log("GOING UP?");
        //     return o;
        //   }

        let { start, end } = o.range;
        let height = 0;

        if (y < position) {
          // scrolling down
          console.log("DOWN");
          while (height < jump && start < count - o.size) {
            height += getRowSize(sizes[start++]) || avgRowHeight;
          }

          jump = height; // Math.min(o.bottom, height);
          end = start + o.size;
        } else {
          // scrolling up
          console.log("UP");
          while (height < bottom - window.innerHeight && end >= o.size) {
            height += getRowSize(sizes[end--]) || avgRowHeight;
          }

          jump = -height;
          start = end - o.size;
        }

        const newTop = start === 0 ? 0 : o.top + jump;
        const newBottom = end === count ? 0 : o.bottom - jump;
        position = y;

        return {
          ...o,
          range: { start, end },
          top: newTop,
          bottom: newBottom,
          scrollTop: newTop
        };
      });
    };

    const observer = new IntersectionObserver(
      entries => {
        if (!disconnected && entries.some(e => e.isIntersecting)) {
          calculate();
        }
      },
      { root, rootMargin: `${threshold}px` }
    );

    observer.observe(bottomRef.current!);
    observer.observe(topRef.current!);

    return () => {
      disconnected = true;
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
