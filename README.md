# GSolid

Simple and performant reactivity for building user interfaces, with GTK 4. GSolid is a universal GTK renderer for [solid-js](https://www.solidjs.com).

-   Performant: Working with native `Gtk.Widget` without heavy middleware. No Tick, No Late.
-   Powerful: Composable reactive primitives plus the flexibility of JSX.
-   Productive: Ergonomics and familiarity that make building simple or complex frontends a breeze.

GSolid supports [Gjs](https://gitlab.gnome.org/GNOME/gjs/).

```jsx
import Gtk from "gi://Gtk?version=4.0";
import GLib from "gi://GLib";
import { createSignal, untrack } from "gsolid";
import { Box, Button, Label, renderToWindow } from "gsolid/gtk4";

Gtk.init();
let loop = GLib.MainLoop.new(null, false);
let win = new Gtk.Window({
    title: "Hello World!",
    default_width: 300,
    default_height: 250,
});

const dispose = renderToWindow(
    () => {
        const [counter, setCounter] = createSignal(0);
        return (
            <Box orientation={Gtk.Orientation.VERTICAL} spacing={8}>
                <Label label={`Count: ${counter()}`} />
                <Button
                    label="+1"
                    valign={Gtk.Align.CENTER}
                    halign={Gtk.Align.CENTER}
                    onClicked={() => setCounter((x) => x + 1)}
                />
            </Box>
        );
    },
    () =>
        new Gtk.Box({
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.CENTER,
        }),
    win
);

win.connect("close-request", () => {
    dispose();
    loop.quit();
});

win.present();

loop.run();
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
