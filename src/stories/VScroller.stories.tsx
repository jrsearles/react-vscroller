import React, {
  useMemo,
  CSSProperties,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  FC,
  ReactElement
} from "react";
import faker from "faker";
import { number, boolean, withKnobs } from "@storybook/addon-knobs";
import { VScroller, VScrollerProps, Range } from "..";
import * as styles from "../styles";
import { inIFrame } from "../dom";

export default {
  title: "VScroller",
  component: VScroller,
  decorators: [withKnobs]
};

type Record = {
  key: number;
  name: string;
  address: string;
  col3: string;
  col4: string;
};

const createRecord = (key: number): Record => {
  return {
    key,
    name: faker.name.findName(),
    address: faker.address.streetAddress(),
    col3: faker.random.words(Math.random() * 20),
    col4: faker.random.words(Math.random() * 50)
  };
};

type SortDirection = "asc" | "desc" | null;
const SortIndicator: FC<{ dir: SortDirection }> = ({ dir }) => {
  switch (dir) {
    case "asc":
      return <>🔽</>;
    case "desc":
      return <>🔼</>;
    default:
      return null;
  }
};

const RangeIndicator: FC<{ range?: Range }> = ({ range }) => {
  return (
    <div style={{ position: "fixed", top: 0, left: 5, zIndex: 2 }}>
      {range?.start}-{range?.end}
    </div>
  );
};

const HeightCell: FC<{ style: CSSProperties }> = (props) => {
  const [size, setSize] = useState(0);
  const ref = useRef<HTMLTableCellElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      setSize(ref.current.clientHeight);
    }
  });

  return (
    <td ref={ref} {...props}>
      {size}
    </td>
  );
};

const WrapperInScroller: FC<{ wrap: boolean }> = ({ wrap, children }) => {
  if (wrap && inIFrame()) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          overflow: "scroll",
          paddingLeft: "1rem",
          paddingRight: "1rem"
        }}
      >
        {children}
      </div>
    );
  }

  return children as ReactElement;
};

const Table = ({
  headerStyle,
  sticky,
  excludeIFrameHack
}: {
  headerStyle: CSSProperties;
  sticky?: boolean;
  excludeIFrameHack?: boolean;
} & Partial<VScrollerProps>) => {
  const [range, setRange] = useState<Range>();
  const count = number("Count", 1000);
  const threshold = number("Threshold", 200);
  const minSize = number("MinSize", 50);
  const [sortedRecords, setSortedRecords] = useState<Array<Record>>([]);
  const [sort, setSort] = useState<{ col: number | null; dir: "asc" | "desc" | null }>({
    col: null,
    dir: null
  });

  let useIFrameHack = false;
  if (!excludeIFrameHack) {
    useIFrameHack = boolean("Use iframe hack", inIFrame() && !!(window as any).chrome);
  }

  const records = useMemo<Array<Record>>(
    () => Array.from(Array(count), (_, i) => createRecord(i)),
    [count]
  );

  useEffect(() => {
    setSortedRecords((s) => {
      if (!sort.col) {
        return records;
      }

      return records.slice().sort((a, b) => {
        let key: keyof Record;
        switch (sort.col) {
          case 1:
            key = "name";
            break;
          case 2:
            key = "address";
            break;
          case 3:
            key = "col3";
            break;
          case 4:
            key = "col4";
            break;
          default:
            return 0;
        }

        let left = sort.dir === "desc" ? b[key] : a[key];
        let right = sort.dir === "desc" ? a[key] : b[key];
        return String(left).localeCompare(String(right));
      });
    });
  }, [records, sort]);

  const toggleSort = (col: number) => {
    setSort((s) => {
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
    <WrapperInScroller wrap={useIFrameHack}>
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
                <th style={{ ...headerStyle, width: "10%" }}>#</th>
                <th style={{ ...headerStyle, width: "10%" }}>
                  <a onClick={() => toggleSort(1)}>
                    Name {sort.col === 1 && <SortIndicator dir={sort.dir} />}
                  </a>
                </th>
                <th style={{ ...headerStyle, width: "10%" }}>
                  <a onClick={() => toggleSort(2)}>
                    Address {sort.col === 2 && <SortIndicator dir={sort.dir} />}
                  </a>
                </th>
                <th style={{ ...headerStyle, width: "30%" }}>
                  <a onClick={() => toggleSort(3)}>
                    Random Text {sort.col === 3 && <SortIndicator dir={sort.dir} />}
                  </a>
                </th>
                <th style={{ ...headerStyle, width: "35%" }}>
                  <a onClick={() => toggleSort(4)}>
                    Random Details {sort.col === 4 && <SortIndicator dir={sort.dir} />}
                  </a>
                </th>
                <th style={{ ...headerStyle, width: "5%" }}>Height</th>
              </tr>
            </thead>
          </VScroller.Head>
          <tbody>
            <VScroller.Body>
              {(index) => (
                <tr>
                  <td style={styles.cell}>{String(sortedRecords[index].key + 1)}</td>
                  <td style={styles.cell}>{sortedRecords[index].name}</td>
                  <td style={styles.cell}>{sortedRecords[index].address}</td>
                  <td style={styles.cell}>{sortedRecords[index].col3}</td>
                  <td style={styles.cell}>{sortedRecords[index].col4}</td>
                  <HeightCell style={styles.cell} />
                </tr>
              )}
            </VScroller.Body>
          </tbody>
          <VScroller.Foot>
            <tfoot>
              <tr>
                <td colSpan={6} style={styles.footerCell}>
                  Count: {count}
                </td>
              </tr>
            </tfoot>
          </VScroller.Foot>
        </table>
      </VScroller>
    </WrapperInScroller>
  );
};

const List: FC = () => {
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
        <ul style={{ listStyle: "none", padding: 0, fontSize: 25 }}>
          <VScroller.Body>
            {(index) => (
              <li
                style={{
                  borderColor: "#ccc",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderRadius: 3,
                  margin: 5,
                  padding: 10
                }}
              >
                {records[index].col4}
              </li>
            )}
          </VScroller.Body>
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
      <Table headerStyle={styles.stickyHeaderCell} sticky excludeIFrameHack />
    </div>
  );
};

export const VirtualList = () => {
  return <List />;
};
