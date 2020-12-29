import { RefObject } from "react";
import { getScrollParent, isFullScreen } from "./dom";
import { IViewport } from "./IViewport";
import { ScrollableContainer } from "./ScrollableContainer";
import { ScrollableWindow } from "./ScrollableWindow";

export class Viewport implements IViewport {
  private readonly _source: RefObject<HTMLElement>;
  private _view: IViewport | undefined;

  constructor(sourceRef: RefObject<HTMLElement>) {
    this._source = sourceRef;
  }

  get view() {
    // need to lazily set this as ref will not be set initially
    if (!this._view) {
      const parent = getScrollParent(this._source.current!);
      this._view = isFullScreen(parent) ? new ScrollableWindow() : new ScrollableContainer(parent);
    }

    return this._view;
  }

  get element() {
    return this.view.element;
  }

  get height() {
    return this.view.height;
  }

  get root() {
    return this.view.root;
  }

  get scrollTop() {
    return this.view.scrollTop;
  }

  set scrollTop(value: number) {
    this.view.scrollTop = value;
  }

  onResize(handler: () => void) {
    return this.view.onResize(handler);
  }
}
