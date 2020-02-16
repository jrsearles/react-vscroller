import React, { cloneElement, isValidElement, Ref, MutableRefObject, ReactNode } from "react";

const setRef = <T>(ref: Ref<T>, node: T) => {
  if (typeof ref === "function") {
    ref(node);
  } else if (ref !== null) {
    (ref as MutableRefObject<T>).current = node;
  }
};

export const cloneElementWithRef = <T>(children: ReactNode, extRef: Ref<T>): ReactNode => {
  const child = React.Children.only(children);
  if (!isValidElement(child)) {
    return child;
  }

  return cloneElement(child, {
    ref: (node: T) => {
      setRef((child as any).ref, node);
      setRef(extRef, node);
    }
  });
};

const overflowRegex = /(auto|scroll)/;

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

    if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
      return parent;
    }
  }

  return document.body;
};
