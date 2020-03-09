import React, { useMemo, CSSProperties, useState, useEffect, FunctionComponent } from "react";
import { number, withKnobs } from "@storybook/addon-knobs";
import { VScroller, VScrollerProps, Range } from "..";
import * as styles from "../styles";

export default {
  title: "VScroller",
  component: VScroller,
  decorators: [withKnobs]
};

type Record = {
  key: number;
  col1: string;
  col2: string;
  col3: string;
  col4: string;
};

const randomInteger = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomString = (min: number, max: number) => {
  const length = randomInteger(min, max);
  return [...Array(length)].map(() => Math.random().toString(36)[2]).join("");
};

const randomPhrase = () => {
  const words = randomInteger(1, 15);
  return [...Array(words)].map(() => randomString(1, 15)).join(" ");
};

const createRecord = (key: number): Record => {
  return {
    key,
    col1: randomPhrase(),
    col2: randomPhrase(),
    col3: randomPhrase(),
    col4: randomPhrase()
  };
};

type SortDirection = "asc" | "desc" | null;
const SortIndicator: FunctionComponent<{ dir: SortDirection }> = ({ dir }) => {
  switch (dir) {
    case "asc":
      return <>🔽</>;
    case "desc":
      return <>🔼</>;
    default:
      return null;
  }
};

const RangeIndicator: FunctionComponent<{ range?: Range }> = ({ range }) => {
  return (
    <div style={{ position: "fixed", top: 0, right: 0, zIndex: 2 }}>
      {range?.start}-{range?.end}
    </div>
  );
};

const Table = ({
  headerStyle,
  sticky
}: { headerStyle: CSSProperties; sticky?: boolean } & Partial<VScrollerProps>) => {
  const [range, setRange] = useState<Range>();
  const count = number("Count", 1000);
  const threshold = number("Threshold", 300);
  const minSize = number("MinSize", 100);
  const [sortedRecords, setSortedRecords] = useState<Array<Record>>([]);
  const [sort, setSort] = useState<{ col: number | null; dir: "asc" | "desc" | null }>({
    col: null,
    dir: null
  });

  const records = useMemo<Array<Record>>(
    () => Array.from(Array(count), (_, i) => createRecord(i)),
    [count]
  );

  useEffect(() => {
    setSortedRecords(s => {
      if (!sort.col) {
        return records;
      }

      return records.slice().sort((a, b) => {
        let key: keyof Record;
        switch (sort.col) {
          case 1:
            key = "col1";
            break;
          case 2:
            key = "col2";
            break;
          case 3:
            key = "col3";
            break;
          case 4:
            key = "col4";
            break;
        }

        let left = sort.dir === "desc" ? b[key!] : a[key!];
        let right = sort.dir === "desc" ? a[key!] : b[key!];
        return String(left).localeCompare(String(right));
      });
    });
  }, [records, sort]);

  const toggleSort = (col: number) => {
    setSort(s => {
      if (s.col === col) {
        switch (s.dir) {
          case "asc":
            return { col, dir: "desc" };
          case "desc":
            return { col: null, dir: null };
          default:
            return { col, dir: "asc" };
        }
      } else {
        return { col, dir: "asc" };
      }
    });
  };

  return (
    <>
      <RangeIndicator range={range} />
      <VScroller
        count={sortedRecords.length}
        fillerStyle={styles.filler}
        onRangeChanged={setRange}
        threshold={threshold}
        pageSize={minSize}
        updateSignal={sortedRecords}
      >
        <table style={styles.table}>
          <VScroller.Head sticky={sticky}>
            <thead>
              <tr>
                <th style={headerStyle}>#</th>
                <th style={headerStyle}>
                  <a onClick={() => toggleSort(1)}>
                    Col 1 {sort.col === 1 && <SortIndicator dir={sort.dir} />}
                  </a>
                </th>
                <th style={headerStyle}>
                  <a onClick={() => toggleSort(2)}>
                    Col 2 {sort.col === 2 && <SortIndicator dir={sort.dir} />}
                  </a>
                </th>
                <th style={headerStyle}>
                  <a onClick={() => toggleSort(3)}>
                    Col 3 {sort.col === 3 && <SortIndicator dir={sort.dir} />}
                  </a>
                </th>
                <th style={headerStyle}>
                  <a onClick={() => toggleSort(4)}>
                    Col 4 {sort.col === 4 && <SortIndicator dir={sort.dir} />}
                  </a>
                </th>
              </tr>
            </thead>
          </VScroller.Head>
          <tbody>
            <VScroller.Body>
              {index => (
                <tr>
                  <td style={styles.cell}>{String(sortedRecords[index].key + 1)}</td>
                  <td style={styles.cell}>{sortedRecords[index].col1}</td>
                  <td style={styles.cell}>{sortedRecords[index].col2}</td>
                  <td style={styles.cell}>{sortedRecords[index].col3}</td>
                  <td style={styles.cell}>{sortedRecords[index].col4}</td>
                </tr>
              )}
            </VScroller.Body>
          </tbody>
          <VScroller.Foot>
            <tfoot>
              <tr>
                <td colSpan={5} style={styles.footerCell}>
                  Count: {count}
                </td>
              </tr>
            </tfoot>
          </VScroller.Foot>
        </table>
      </VScroller>
    </>
  );
};

const List: FunctionComponent = () => {
  const [range, setRange] = useState<Range>();
  const count = number("Count", 1000);
  const threshold = number("Threshold", 300);
  const minSize = number("MinSize", 100);

  const records = useMemo<Array<Record>>(
    () => Array.from(Array(count), (_, i) => createRecord(i)),
    [count]
  );

  return (
    <>
      <RangeIndicator range={range} />
      <VScroller
        count={count}
        fillerStyle={styles.filler}
        onRangeChanged={setRange}
        threshold={threshold}
        pageSize={minSize}
        updateSignal={records}
      >
        <ul>
          <VScroller.Body>{index => <li>{records[index].col4}</li>}</VScroller.Body>
        </ul>
      </VScroller>
    </>
  );
};

export const VirtualGridWithStickyHeader = () => {
  return <Table headerStyle={styles.stickyHeaderCell} sticky />;
};

export const VirtualGrid = () => {
  return <Table headerStyle={styles.headerCell} />;
};

export const VirtualGridInScrollableContainerWithStickyHeader = () => {
  return (
    <div style={{ width: "80vw", height: "80vh", overflow: "auto", position: "relative" }}>
      <Table headerStyle={styles.stickyHeaderCell} sticky />
    </div>
  );
};

export const VirtualList = () => {
  return <List />;
};
