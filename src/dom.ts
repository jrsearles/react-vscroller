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
  const checkFrame = (resolve: () => void) => {
    const { y } = target.getBoundingClientRect();
    requestAnimationFrame(() => {
      if (y === target.getBoundingClientRect().y) {
        resolve();
      } else {
        checkFrame(resolve);
      }
    });
  };

  return new Promise<never>(checkFrame);
};
