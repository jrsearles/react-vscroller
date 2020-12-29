import { IViewport } from "./IViewport";

export class ScrollableContainer implements IViewport {
  readonly element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  get height() {
    return this.element.offsetHeight;
  }

  get root() {
    return this.element;
  }

  get scrollTop() {
    return this.element.scrollTop;
  }

  set scrollTop(value: number) {
    this.element.scrollTop = value;
  }

  onResize(handler: () => void) {
    const observer = new ResizeObserver(handler);
    observer.observe(this.element);
    return () => observer.disconnect();
  }
}
