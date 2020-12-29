import {
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
  Dispatch,
  SetStateAction,
  useEffect
} from "react";

export const useHandler = <TArg>(callback?: (arg: TArg) => void) => {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });
  return useCallback((arg: TArg) => callbackRef.current?.(arg), []);
};

export const useSafeState = <T>(initialValue: T | (() => T)): [T, Dispatch<SetStateAction<T>>] => {
  const [state, setState] = useState(initialValue);
  const mountedRef = useRef(true);

  useLayoutEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetter = useCallback((setterOrState: SetStateAction<T>) => {
    mountedRef.current && setState(setterOrState);
  }, []);

  return [state, safeSetter];
};
