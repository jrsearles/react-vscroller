import { CSSProperties } from "react";

export const container: CSSProperties = { width: "fit-content" };

// STORY STYLES
export const filler: CSSProperties = {
  background:
    "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVQYlWNgYGCQwoKxgqGgcJA5h3yFAAs8BRWVSwooAAAAAElFTkSuQmCC) repeat",
  zIndex: -1
};

export const table: CSSProperties = {
  position: "relative",
  borderCollapse: "separate",
  borderSpacing: 0,
  tableLayout: "fixed"
};

export const stickyHeaderCell: CSSProperties = {
  backgroundColor: "white",
  borderBottomWidth: 1,
  borderBottomColor: "#ccc",
  borderBottomStyle: "solid",
  position: "sticky",
  top: 0,
  padding: 20,
  zIndex: 1
};

export const headerCell: CSSProperties = {
  backgroundColor: "white",
  borderBottomWidth: 1,
  borderBottomColor: "#ccc",
  borderBottomStyle: "solid",
  padding: 20
};

export const cell: CSSProperties = {
  borderBottomWidth: 1,
  borderBottomColor: "#ccc",
  borderBottomStyle: "solid",
  padding: 6,
  wordWrap: "break-word",
  verticalAlign: "top"
};

export const footerCell: CSSProperties = {
  fontWeight: "bold",
  padding: 20,
  textAlign: "right"
};
