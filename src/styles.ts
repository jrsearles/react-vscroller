import { CSSProperties } from "react";

export const filler: CSSProperties = {
  background:
    "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVQYlWNgYGCQwoKxgqGgcJA5h3yFAAs8BRWVSwooAAAAAElFTkSuQmCC) repeat"
};

export const container: CSSProperties = { width: "max-content" };

export const body: CSSProperties = { width: "fit-content", padding: 0, margin: 0 };

// STORY STYLES
export const table: CSSProperties = {
  position: "relative",
  borderCollapse: "separate",
  borderSpacing: 0,
  tableLayout: "fixed"
};

export const headerCell: CSSProperties = {
  backgroundColor: "white",
  borderBottomWidth: 1,
  borderBottomColor: "#ccc",
  borderBottomStyle: "solid",
  position: "sticky",
  top: 0,
  padding: 6,
  zIndex: 1
};

export const cell: CSSProperties = {
  borderBottomWidth: 1,
  borderBottomColor: "#ccc",
  borderBottomStyle: "solid",
  padding: 6,
  width: 100
};
