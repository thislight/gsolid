# GSolid and TypeScript

You can use GSolid with TypeScript (.ts/.tsx). There is the recommended configuration:

````json5
{
    "compilerOptions": {
        "types": ["@girs/gjs", "@girs/gtk-4.0"], // GI type decralations
        "isolatedModules": true,
        "esModuleInterop": true,
        "jsx": "preserve",
        "jsxImportSource": "gsolid",
    },
}
````

It's also recommended to use the components in `gsolid/gtk4`.
