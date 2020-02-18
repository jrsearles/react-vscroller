import { useRef, useEffect, FunctionComponent, ReactElement } from "react";
import { useVGridState } from "./VGridContext";
import { cloneElementWithRef } from "./utils";

type VGridItemProps = {
  index: number;
};

export const VGridItem: FunctionComponent<VGridItemProps> = ({ index, children }) => {
  const state = useVGridState();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    state.sizes[index] = () => ref.current!.offsetHeight;

    // We don't care if the ref instance is different - we're not doing cleanup here, but
    // rather storing the last known height before unmounting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => void (state.sizes[index] = ref.current!.offsetHeight);
  }, [state, index]);

  return cloneElementWithRef(children, ref) as ReactElement;
};
