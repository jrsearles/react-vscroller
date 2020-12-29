import { getIntersectionObserverRoot } from "./dom";
import { IViewport } from "./IViewport";

export class ScrollableWindow implements IViewport {
  get element() {
    return document.body;
  }

  get height() {
    return window.innerHeight;
  }

  get root() {
    return getIntersectionObserverRoot(this.element);
  }

  get scrollTop() {
    return document.documentElement.scrollTop ?? document.body.scrollTop;
  }

  set scrollTop(value: number) {
    document.documentElement.scrollTop = document.body.scrollTop = value;
  }

  onResize(handler: () => void) {
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }
}
