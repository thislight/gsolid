/**
 * SPDX: Apache-2.0
 */

import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import GObject from "gi://GObject?version=2.0";
import { GtkAccessibleProps, GtkWidgetProps, RefAble } from "./common.js";
import {
    Component,
    JSX,
    createRenderEffect,
    onMount,
    splitProps,
    createContext,
    useContext,
    onCleanup,
    children,
} from "../index.js";
import { forwardRef, useWidget } from "../widget.jsx";
import { createStore } from "solid-js/store";

export const WindowContext = /* @__PURE__ */ createContext<Gtk.Window>();

export function useWindow(): Gtk.Window {
    const window = useContext(WindowContext);
    if (!window) {
        throw new ReferenceError("could not find WindowContext on tree");
    }
    return window;
}

type WindowProps<T extends Gtk.Window = Gtk.Window> = {
    application?: Gtk.Application;
    decorated?: boolean;
    defaultHeight?: number;
    defaultWidth?: number;
    deletable?: boolean;
    destroyWithParent?: boolean;
    display?: Gdk.Display;
    focusWidget?: Gtk.Widget;
    fullscreened?: boolean;
    handleMenubarAccel?: boolean;
    hideOnClose?: boolean;
    iconName?: string;
    isActive?: boolean;
    maximized?: boolean;
    modal?: boolean;
    resizable?: boolean;
    startupId?: string;
    title?: string;
    titlebar?: Gtk.Widget;
    transientFor?: Gtk.Window;
    children?: JSX.Element;

    // Signals
    onActivateDefaullt?: (self: T) => void;
    onActivateFocus?: (self: T) => void;
    onCloseRequest?: (self: T) => boolean;
    onEnableDebugging?: (self: T, toggle: boolean) => boolean;
} & GtkWidgetProps<T> &
    GtkAccessibleProps &
    RefAble<T>;

/**
 * Window as a component.
 *
 * This component sets `WindowContext`.
 */
export const Window: Component<WindowProps> = (props) => {
    const [p, rest] = splitProps(props, ["children"]);
    const node: Gtk.Window = useWidget(Gtk.Window, rest);
    const child = children(() => (
        <WindowContext.Provider value={node} children={p.children} />
    ));
    createRenderEffect(() => {
        const c = child();
        if (c) {
            node.set_child(c);
        } else {
            node.set_child(null);
        }
    });
    return node;
};

/**
 * Reactive window additionally receives `open` property to open or close winodw.
 *
 * This component sets `WindowContext`.
 *
 * You must keep the reference in your program somewhere, or the window may be collected.
 *
 * ````jsx
 * const [isOpen, setIsOpen] = createSignal(false)
 * const anotherWindow = <ReactiveWindow open={isOpen()} onCloseRequest={() => setIsOpen(x => !x)} />
 *
 * onMount(() => setIsOpen(true))
 * ````
 *
 * In above program, your `anotherWindow` may be collected before the reactive system brings the window up.
 *
 * It will work if you do `onMount(() => anotherWindow.show())` instead, as you hold the reference here.
 *
 * But it's completely ok if you pass `true` before hand.
 * ````jsx
 * const [isOpen, setIsOpen] = createSignal(true)
 *
 * <ReactiveWindow open={isOpen()} onCloseRequest={() => setIsOpen(x => !x)} />
 * ````
 */
export const ReactiveWindow: Component<WindowProps & { open: boolean }> = (
    props
) => {
    const [p, rest] = splitProps(props, ["ref", "open"]);
    let ref: Gtk.Window;

    onMount(() => {
        const currentOpen = ref.is_visible();
        if (currentOpen) {
            if (!p.open) {
                ref.close();
            }
        } else {
            if (p.open) {
                ref.present();
            }
        }
    });

    return <Window ref={(r) => (ref = forwardRef(r, p.ref))} {...rest} />;
};

/**
 * Object about window's size and scale factor.
 */
export interface WindowGeometry {
    /**
     * Window's actual height.
     */
    readonly height: number;

    /**
     * Window's actual width.
     */
    readonly width: number;

    /**
     * Window's default height.
     *
     * This is equals to the actual height unless the window is fullscreened or maximized.
     */
    readonly defaultHeight: number;

    /**
     * Window's default width.
     *
     * This is equals to the actual width unless the window is fullscreened or maximized.
     */
    readonly defaultWidth: number;

    readonly fullscreened: boolean;
    readonly maximized: boolean;

    /**
     * The scaling factor of the window.
     */
    readonly devicePixelRatio: number;
}

/**
 * Get reactive object about current window's size and scale factor.
 *
 * `WindowContext` must be set on the tree, or `ReferenceError` will be thrown.
 */
export function useWindowSize(): WindowGeometry {
    const window = useWindow();
    const [geometry, setGeometry] = createStore<WindowGeometry>({
        height: 0,
        width: 0,
        defaultHeight: 0,
        defaultWidth: 0,
        fullscreened: false,
        maximized: false,
        devicePixelRatio: 0,
    });

    const resetWindowGeometry = () => {
        const [defaultWidth, defaultHeight] = window.get_default_size();
        const { height, width, scale_factor } = window.get_surface();
        setGeometry({
            defaultWidth,
            defaultHeight,
            maximized: window.maximized,
            fullscreened: window.fullscreened,
            width,
            height,
            devicePixelRatio: scale_factor,
        });
    };

    const signalCleanups: [GObject.Object, number][] = [];

    signalCleanups.push([
        window,
        window.connect("realize", () => {
            const surface = window.get_surface();
            if (surface == null) {
                throw new ReferenceError(
                    "window is not associated with a GdkSurface"
                );
            }
            signalCleanups.push([
                surface,
                surface.connect("layout", resetWindowGeometry),
            ]);
        }),
    ]);

    onCleanup(() => {
        for (const [object, id] of signalCleanups) {
            object.disconnect(id);
        }
    });

    onMount(resetWindowGeometry);

    return geometry;
}
