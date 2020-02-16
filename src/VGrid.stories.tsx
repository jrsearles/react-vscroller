import React, { useMemo } from "react";
import { VGrid, VGridConsumer, VGridHead, VGridItem } from ".";
import { number } from "@storybook/addon-knobs";
import * as styles from "./styles";

export default { title: "VGrid" };

type Record = {
  key: number;
  col1: string;
  col2: string;
  col3: string;
  col4: string;
};

const createRecord = (key: number): Record => {
  return {
    key,
    col1: Math.random()
      .toString(36)
      .substring(7),
    col2: Math.random()
      .toString(36)
      .substring(7),
    col3: Math.random()
      .toString(36)
      .substring(7),
    col4: Math.random()
      .toString(36)
      .substring(7)
  };
};

export const VirtualGrid = () => {
  const count = number("Count", 1000);
  const records = useMemo(() => Array.from(Array(count), (_, i) => createRecord(i)), [count]);

  return (
    <VGrid count={count} fillerStyle={styles.filler}>
      <table style={styles.table}>
        <VGridHead>
          <thead>
            <tr>
              <th style={styles.headerCell}>#</th>
              <th style={styles.headerCell}>Col 1</th>
              <th style={styles.headerCell}>Col 2</th>
              <th style={styles.headerCell}>Col 3</th>
              <th style={styles.headerCell}>Col 4</th>
            </tr>
          </thead>
        </VGridHead>
        <tbody>
          <VGridConsumer>
            {({ range }) => (
              <>
                {records.slice(range.start, range.end).map((record, index) => (
                  <VGridItem index={index + range.start} key={record.key}>
                    <tr>
                      <td style={styles.cell}>{String(record.key + 1)}</td>
                      <td style={styles.cell}>{record.col1}</td>
                      <td style={styles.cell}>{record.col2}</td>
                      <td style={styles.cell}>{record.col3}</td>
                      <td style={styles.cell}>{record.col4}</td>
                    </tr>
                  </VGridItem>
                ))}
              </>
            )}
          </VGridConsumer>
        </tbody>
      </table>
    </VGrid>
  );
};
