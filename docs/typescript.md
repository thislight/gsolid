# GSolid and TypeScript

You can use GSolid with TypeScript (.ts/.tsx). There is the recommended configuration:

This configuration uses packages `@girs/gjs` and `@girs/gtk-4.0`.

```json5
{
    compilerOptions: {
        types: ["@girs/gjs", "@girs/gjs/dom", "@girs/gtk-4.0"], // GI type decralations
        isolatedModules: true,
        esModuleInterop: true,
        jsx: "preserve",
        jsxImportSource: "gsolid",
        lib: [
            "ES2015",
            "ES2016",
            "ES2017",
            "ES2018",
            "ES2019",
            "ES2020",
            "ES2021",
            "ES2022",
            "ESNext",
        ]
    },
}
```

It's also recommended to use the components in `gsolid/gtk4`.
