export interface IViewport {
  readonly element: HTMLElement;
  readonly height: number;
  readonly root: Element | null;
  scrollTop: number;
  onResize(func: () => void): () => void;
}
