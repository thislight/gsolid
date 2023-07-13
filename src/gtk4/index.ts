/**
 * SPDX: Apache-2.0
 */
import { createContext, useContext } from "../index.js";
import Gtk from "gi://Gtk?version=4.0";

export * from "./buttons.jsx";

export * from "./containers.jsx";

export * from "./displays.jsx";

export * from "./entries.jsx";

export * from "./windows.jsx";

export const WindowContext = /* @__PURE__ */ createContext<Gtk.Window>();

export function useWindow(): Gtk.Window {
    const window = useContext(WindowContext);
    if (!window) {
        throw new ReferenceError("could not find WindowContext on tree");
    }
    return window;
}
