import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import external from "rollup-plugin-peer-deps-external";
import pkg from "./package.json";

const extensions = [".js", ".jsx", ".ts", ".tsx"];

export default {
  input: pkg.source,
  output: [
    {
      file: pkg.main,
      format: "cjs",
      name: "VScroller"
    },
    {
      file: pkg.module,
      format: "es"
    },
    {
      file: pkg.browser,
      format: "umd",
      name: "VScroller",
      globals: {
        react: "React"
      }
    }
  ],
  plugins: [
    resolve({ extensions }),
    external(),
    babel({ extensions, include: ["src/**/*"], babelHelpers: "runtime" })
  ]
};
