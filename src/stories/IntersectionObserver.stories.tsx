import React, { FC, useEffect, useRef, useState } from "react";

export default {
  title: "Intersection Observer playground"
};

const Boolean: FC<{ value: boolean }> = ({ value }) => {
  return <>{value ? "✔" : "❌"}</>;
};

export const ObserverTester = () => {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [topVisible, topSetter] = useState(true);
  const [bottomVisible, bottomSetter] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.target === topRef.current) {
            topSetter(e.isIntersecting);
          } else {
            bottomSetter(e.isIntersecting);
          }
        });
      },
      { root: (document as unknown) as Element, rootMargin: "200px 0px" }
    );

    observer.observe(topRef.current!);
    observer.observe(bottomRef.current!);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div style={{ position: "fixed", top: 0, right: 0 }}>
        <Boolean value={topVisible} />
        <Boolean value={bottomVisible} />
      </div>
      <div ref={topRef} style={{ height: topVisible ? 300 : 0, backgroundColor: "red" }} />
      <div style={{ height: 2000 }}>
        <div style={{ height: 200, backgroundColor: "green" }} />
        <div style={{ height: 1600 }}>CONTENT</div>
        <div style={{ height: 200, backgroundColor: "green" }} />
      </div>
      <div
        ref={bottomRef}
        style={{ height: bottomVisible ? 300 : 0, backgroundColor: "red" }}
      ></div>
    </>
  );
};
