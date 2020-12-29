// adapted from https://stackoverflow.com/a/42543908
export const getScrollParent = (element: HTMLElement) => {
  let style = getComputedStyle(element);
  const excludeStaticParent = style.position === "absolute";

  if (style.position === "fixed") {
    return document.body;
  }

  for (let parent = element; (parent = parent.parentElement!); ) {
    style = getComputedStyle(parent);
    if (excludeStaticParent && style.position === "static") {
      continue;
    }

    if (/(auto|scroll)/.test(style.overflow + style.overflowY + style.overflowX)) {
      return parent;
    }
  }

  return document.body;
};

export const waitForScrollToStop = (target: HTMLElement) => {
  const checkFrame = (resolve: (_: any) => void) => {
    const { y } = target.getBoundingClientRect();
    window.requestAnimationFrame(() => {
      if (y === target.getBoundingClientRect().y) {
        resolve(undefined);
      } else {
        checkFrame(resolve);
      }
    });
  };

  return new Promise<never>(checkFrame);
};

export const isFullScreen = (el: HTMLElement) => el === document.body;

// https://stackoverflow.com/a/326076
export const inIFrame = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

// Forcing cast so it is accepted in as root element - some browser support
// document as root, but the type definition doesn't recognise this.
const documentAsRoot = (document as unknown) as Element;
let documentRootSupported = true;
try {
  new IntersectionObserver(() => {}, { root: documentAsRoot });
} catch (e) {
  documentRootSupported = false;
}

export const getIntersectionObserverRoot = (el: HTMLElement) => {
  if (!isFullScreen(el)) {
    return el;
  }

  if (documentRootSupported && inIFrame()) {
    // In an iframe, using the document element as root will use the viewport of the actual iframe.
    // See: https://github.com/w3c/IntersectionObserver/issues/372
    return documentAsRoot;
  }

  return null;
};
