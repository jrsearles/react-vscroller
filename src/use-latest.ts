import { useRef, useEffect } from "react";

export const useLatest = <T>(obj: T) => {
  const ref = useRef<T>(obj);
  useEffect(() => void (ref.current = obj));
  return ref;
};
