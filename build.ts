import * as esbuild from "esbuild";

const entryPoints = [
  "src/index.ts",
  "src/jsx-runtime.ts",
  "src/gtk4/common.ts",
  "src/gtk4/index.ts",
  "src/web-ponyfill.ts",
  "src/reactive.ts",
  "src/store.ts",
  "src/storage.ts",
  "src/gobject.ts",
  "src/widget.ts",
];

const gtk4JsxEntryPoints = [
  "buttons.tsx",
  "containers.tsx",
  "displays.tsx",
  "entries.tsx",
  "windows.tsx",
  "stack.tsx",
].map((x) => `src/gtk4/${x}`);

await Promise.all([
  esbuild.build({
    entryPoints,
    outdir: "dist",
    format: "esm",
    jsx: "preserve",
  }),
  esbuild.build({
    entryPoints,
    outdir: "dist",
    format: "cjs",
    jsx: "preserve",
    outExtension: {
      ".js": ".cjs",
    },
  }),
  esbuild.build({
    entryPoints: gtk4JsxEntryPoints,
    outdir: "dist/gtk4",
    format: "esm",
    jsx: "preserve",
    outExtension: {
      ".js": ".jsx",
    },
  }),
]);
