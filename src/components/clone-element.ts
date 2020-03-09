import React, {
  cloneElement,
  isValidElement,
  Ref,
  MutableRefObject,
  ReactNode,
  ReactElement
} from "react";

const setRef = <T>(ref: Ref<T>, value: T) => {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref != null) {
    (ref as MutableRefObject<T>).current = value;
  }
};

// This wraps a component, setting the ref but also making sure the ref attached to the
// component is set. Is there a better way to do this?
export const cloneElementWithRef = <T>(children: ReactNode, extRef: Ref<T>): ReactElement => {
  const child = React.Children.only(children);
  if (!isValidElement(child)) {
    return child as ReactElement;
  }

  return cloneElement(child, {
    ref: (node: T) => {
      setRef((child as any).ref, node);
      setRef(extRef, node);
    }
  });
};
