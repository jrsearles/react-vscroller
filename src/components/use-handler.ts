import { useCallback, useRef, useEffect } from "react";

export const useHandler = <T1>(callback?: (arg: T1) => void) => {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });
  return useCallback((arg: T1) => callbackRef.current?.(arg), []);
};
