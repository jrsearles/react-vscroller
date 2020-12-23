import React, { FC, useEffect, useRef, useState } from "react";

export default {
  title: "Intersection Observer playground"
};

export const Boolean: FC<{ value: boolean }> = ({ value }) => {
  return <>{value ? "✔" : "❌"}</>;
};

export const ObserverTester = () => {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [topVisible, topSetter] = useState(true);
  const [bottomVisible, bottomSetter] = useState(false);
  const [y, setY] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        console.log("checking...", entries.length);
        entries.forEach((e) => {
          if (e.target === topRef.current) {
            topSetter(e.isIntersecting);
          } else {
            bottomSetter(e.isIntersecting);
          }
        });
      },
      { root: (document as unknown) as Element, rootMargin: "50px 0px" }
    );

    observer.observe(topRef.current!);
    observer.observe(bottomRef.current!);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handler = () => setY(window.scrollY);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <div style={{ position: "fixed", top: 0, right: 0 }}>
        <Boolean value={topVisible} />
        <Boolean value={bottomVisible} />
        <>{y}</>
      </div>
      <div ref={topRef} style={{ height: 300, backgroundColor: "yellowgreen" }}></div>
      <div style={{ height: 2000 }}>CONTENT</div>
      <div ref={bottomRef} style={{ height: 300, backgroundColor: "yellowgreen" }}></div>
    </>
  );
};
