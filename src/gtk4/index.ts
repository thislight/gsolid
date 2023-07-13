/**
 * SPDX: Apache-2.0
 */
import { createContext, render, useContext } from "../index.js";
import Gtk from "gi://Gtk?version=4.0";

export * from "./buttons.jsx";

export * from "./containers.jsx";

export * from "./displays.jsx";

export * from "./entries.jsx";

export * from "./windows.jsx";

/**
 * Insert elements into the container from `container` and set the container as the child of the `window`.
 * @param code the element will be rendered
 * @param container the function creates container (Note: this function does not be run under reactive context - even jsx won't work)
 * @param window the window will be rendered to
 */
export function renderToWindow(
    code: (window: Gtk.Window) => Gtk.Widget,
    container: () => Gtk.Widget,
    window: Gtk.Window
): () => void {
    const view = container();
    window.set_child(view);
    const dispose = render(() => code(window), view);
    const disposeWrap = () => {
        if (window.get_child() == view) {
            window.set_child(null);
        }
        dispose();
    };
    return disposeWrap;
}

export const WindowContext = /* @__PURE__ */ createContext<Gtk.Window>();

export function useWindow(): Gtk.Window {
    const window = useContext(WindowContext);
    if (!window) {
        throw new ReferenceError("could not find WindowContext on tree");
    }
    return window;
}
