import { RefObject } from "react";
import { getScrollParent, getIntersectionObserverRoot, isFullScreen } from "./dom";

export class Viewport {
  private readonly _source: RefObject<HTMLElement>;
  private _window: HTMLElement | undefined;

  constructor(sourceRef: RefObject<HTMLElement>) {
    this._source = sourceRef;
  }

  get element() {
    // Need to do this lazily so ref is set beforehand
    return this._window || (this._window = getScrollParent(this._source.current!));
  }

  get height() {
    return isFullScreen(this.element) ? window.innerHeight : this.element.offsetHeight;
  }

  get root() {
    return getIntersectionObserverRoot(this.element);
  }

  get scrollTop() {
    if (isFullScreen(this.element)) {
      return document.documentElement.scrollTop ?? document.body.scrollTop;
    }

    return this.element.scrollTop;
  }

  set scrollTop(value: number) {
    if (isFullScreen(this.element)) {
      document.documentElement.scrollTop = document.body.scrollTop = value;
    } else {
      this.element.scrollTop = value;
    }
  }

  onResize(handler: () => void) {
    if (isFullScreen(this.element)) {
      window.addEventListener("resize", handler);
      return () => window.removeEventListener("resize", handler);
    }

    const observer = new ResizeObserver(handler);
    observer.observe(this.element);
    return () => observer.disconnect();
  }
}
