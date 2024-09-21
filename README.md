# GSolid

Simple and performant reactivity for building user interfaces, with GTK 4. GSolid is a universal GTK renderer for [solid-js](https://www.solidjs.com).

- Performant: Working with native `Gtk.Widget` without heavy middleware. No Tick, No Late.
- Powerful: Composable reactive primitives plus the flexibility of JSX.
- Productive: Ergonomics and familiarity that make building simple or complex frontends a breeze.

GSolid supports [Gjs](https://gitlab.gnome.org/GNOME/gjs/).

Launch your project in seconds with [gsolid-app-starter](https://github.com/thislight/gsolid-app-starter)!

```jsx
import Gtk from "gi://Gtk?version=4.0";
import { createSignal } from "gsolid";
import { Box, Button, Label, ReactiveWindow, createApp } from "gsolid/gtk4";

createApp((app) => {
    const [counter, setCounter] = createSignal(0);
    app.add_window(
        <ReactiveWindow
            open={true}
            onCloseRequest={() => false}
            title="Hello World!"
            defaultWidth={300}
            defaultHeight={250}
        >
            <Box orientation={Gtk.Orientation.VERTICAL} spacing={8}>
                <Label label={`Count: ${counter()}`} />
                <Button
                    label="+1"
                    valign={Gtk.Align.CENTER}
                    halign={Gtk.Align.CENTER}
                    onClicked={() => setCounter((x) => x + 1)}
                />
            </Box>
        </ReactiveWindow> as Gtk.Window);
}, { application_id: "org.example.MyApp" }).run(null);

```

## Bundling

- [esbuild-plugin-gsolid](https://github.com/thislight/esbuild-plugin-gsolid)

Interesting on writing bundler for GSolid? See [Notes on build Applications](./docs/build-app.md).

## Other Documents

- [JSX](./docs/jsx.md)
- [TypeScript](./docs/typescript.md)

## Special Libraries

GSolid provides some libraries to improve UX for gjs.

Mostly we create the library similiar to the Web API, but they are not 1:1 simulation to the API on the other platform.

- `gsolid/fetch` - Fetch API, libsoup 3.x wrapper

## License

SPDX: Apache-2.0
