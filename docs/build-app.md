# Notes to build Applications

This document is for the bundler developers and describes some requirements to correctly bundle gsolid application.

You can also check out the [esbuild-plugin-gsolid](https://github.com/thislight/esbuild-plugin-gsolid).

## Translate JSX files using [babel-preset-solid](https://github.com/solidjs/solid/tree/main/packages/babel-preset-solid)

Sample babel config:

```js
presets: [
    [
        "babel-preset-solid",
        {
            moduleName: "gsolid/jsx-runtime",
            generate: "universal",
        },
    ],
],
```

The preset does not support TSX files, so they must be translated to JSXs before feeding babel-preset-solid.

## Inject `gsolid/web-ponyfill`

`gsolid/web-ponyfill` is a ESM ponyfill. Every export must be imported in `solid-js`'s files. For example, such content will be injected into the start of the every files:

````js
import {queueMicrotask} from "gsolid/web-ponyfill"
````

Since the `solid-js` does not have dependency to `gsolid`, the bundler must resolve the `gsolid/web-ponyfill` to a nearest package.

Currently, copying the file content into the files works. The file SHOULD be no side effect.

