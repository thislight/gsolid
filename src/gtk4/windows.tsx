/**
 * @license Apache-2.0
 * @module
 */

import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import { GtkAccessibleProps, GtkWidgetProps, RefAble } from "./common.js";
import {
    Component,
    JSX,
    createRenderEffect,
    onMount,
    splitProps,
    createContext,
    useContext,
    children,
    disconnectOnCleanup,
    catchError,
    onCleanup,
    createSignal,
    type Accessor,
} from "../index.js";
import { useWidget } from "../widget.jsx";
import { createStore } from "solid-js/store";
import { useApplication } from "./index.js";

export const WindowContext = /* @__PURE__ */ createContext<Gtk.Window>();

/**
 * Get nearset {@link WindowContext} value on tree.
 *
 * @throws ReferenceError if {@link WindowContext} is unset
 * @returns value from {@link WindowContext}
 */
export function useWindow(): Gtk.Window {
    const window = useContext(WindowContext);
    if (!window) {
        throw new ReferenceError("could not find WindowContext on tree");
    }
    return window;
}

export type WindowProps<T extends Gtk.Window = Gtk.Window> = {
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
    /**
     *
     * @param self
     * @returns
     * @event
     */
    onActivateDefaullt?: (self: T) => void;
    /**
     *
     * @param self
     * @returns
     * @event
     */
    onActivateFocus?: (self: T) => void;
    /**
     *
     * @param self
     * @returns
     * @event
     */
    onCloseRequest?: (self: T) => boolean;
    /**
     * @event
     */
    onEnableDebugging?: (self: T, toggle: boolean) => boolean;
} & GtkWidgetProps<T> &
    GtkAccessibleProps &
    RefAble<T>;

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
 * <Window open={isOpen()} onCloseRequest={() => setIsOpen(x => !x)} />
 * ````
 *
 * This component sets `WindowContext`.
 * It will automatically connect to the current application if it exists.
 *
 * @group Components
 */
export const Window: Component<WindowProps & { open: boolean }> = (props) => {
    const [p, rest] = splitProps(props, ["children", "open"]);
    const ref: Gtk.Window = useWidget(Gtk.Window, rest);
    const child = children(() => (
        <WindowContext.Provider value={ref} children={p.children} />
    ));

    const app = catchError(useApplication, (reason) => {
        if (reason instanceof ReferenceError) {
            console.debug(
                "<Window /> is not connected to an application automatically.",
                reason,
            );
        }
    });
    if (app) {
        app.add_window(ref);
    }

    createRenderEffect(() => {
        const c = child();
        if (c) {
            ref.set_child(c);
        } else {
            ref.set_child(null);
        }
    });

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

    return ref;
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
 * @throws ReferenceError if {@link WindowContext} is unset.
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

    const trackGSignal = disconnectOnCleanup([]);

    trackGSignal(
        window,
        window.connect("realize", () => {
            const surface = window.get_surface();
            if (surface == null) {
                throw new ReferenceError(
                    "window is not associated with a GdkSurface",
                );
            }
            trackGSignal(
                surface,
                surface.connect("layout", resetWindowGeometry),
            );
        }),
    );

    onMount(resetWindowGeometry);

    return geometry;
}

/**
 * Get the {@link Gdk.FrameClock} from the surface of the current window.
 *
 * The {@link Gdk.FrameClock} may changed if the toplevel of the window changed,
 * please keep that in mind as you need to clean up resource if the value is changed.
 *
 * If you prefer Web-style `requestAnimationFrame`, use {@link createRAF}.
 *
 * @see {@link createRAF}
 * @see {@link makeRequestAnimationFrame}
 */
export function createWindowFrameClock() {
    const window = useWindow();
    const surface = window.get_surface();
    const [clk, setClk] = createSignal<Gdk.FrameClock>(
        surface.get_frame_clock(),
    );

    const eneterMonitorId = surface.connect("enter-monitor", (surface) =>
        setClk(surface.get_frame_clock()),
    );
    const leaveMonitorId = surface.connect("leave-monitor", (surface) =>
        setClk(surface.get_frame_clock()),
    );

    onCleanup(() => {
        surface.disconnect(eneterMonitorId);
        surface.disconnect(leaveMonitorId);
    });

    return clk;
}

export type FrameRequestCallback = (timestamp: number) => void;

/**
 * Creates an auto-disposing requestAnimationFrame loop.
 *
 * If you prefer GTK-style {@link Gdk.FrameClock}, use {@link createWindowFrameClock}.
 *
 * @see {@link createWindowFrameClock}
 * @see {@link makeRequestAnimationFrame}
 *
 * @example
 * const [width, setWidth] = createSingal(50);
 * const TARGET_WIDTH = 100;
 * const ANIMATION_DUR_MS = 200;
 * let tsStart = -1;
 * let originalWidth = untrack(width);
 *
 * const [,start,end] = createRAF((ts) => {
 *      const pg = ((ts - ts_start) / ANIMATION_DUR_MS);
 *      setWidth(originalWidth + (TARGET_WIDTH - originalWidth) * pg);
 *      if (pg >= 1) {
 *          end();
 *      }
 *  });

 * onMount(() => (tsStart = start()));
 */
export function createRAF(
    callback: FrameRequestCallback,
): readonly [
    running: Accessor<boolean>,
    start: () => number,
    end: VoidFunction,
] {
    const frameClock = createWindowFrameClock();
    const [running, setRunning] = createSignal(false);

    createRenderEffect(() => {
        const frclk = frameClock();
        if (!frclk) return;
        const listenId = frclk.connect("update", (clk) => {
            const ts = clk.get_frame_time();
            callback(ts);
        });

        onCleanup(() => {
            frclk.disconnect(listenId);
        });
    });

    createRenderEffect(() => {
        const frclk = frameClock();
        if (!frclk) return;
        if (running()) {
            frclk.begin_updating();
        } else {
            frclk.end_updating();
        }
    });

    return [
        running,
        () => {
            setRunning(true);
            return frameClock()?.get_frame_time() ?? 0;
        },
        () => setRunning(false),
    ];
}

function requestAnimationFrame(
    clock: Gdk.FrameClock,
    callback: FrameRequestCallback,
) {
    const id = clock.connect("update", (clock) => {
        callback(clock.get_frame_time());
        cancelAnimationFrame(clock, id);
    });
    clock.request_phase(Gdk.FrameClockPhase.UPDATE);
    return id;
}

function cancelAnimationFrame(clock: Gdk.FrameClock, id: number) {
    clock.disconnect(id);
}

/**
 * Create a pair of functions emulates [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
 * and [cancelAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame).
 *
 * Suits one-shot usage and DOM-compatibility.
 *
 * If you are working on animation, it's recommended to use {@link createRAF} or {@link createWindowFrameClock}.
 * They are more efficient.
 *
 * **Known issues:** For reducing the abstraction cost, cancelling animation frame may sliently fail or cancels a wrong callback,
 * as the {@link clock} changed. It's not recommended to do that for the risk.
 *
 * Opened to disscussion on this since me (Rubicon) thinks the `cancelAnimationFrame` is rarely used and it's OK to accept the risk
 * and this can avoid much of additional memory access.
 *
 * @see {@link createRAF}
 * @see {@link createWindowFrameClock}
 */
export function makeRequestAnimationFrame(
    clock: Accessor<Gdk.FrameClock>,
): readonly [
    requestAnimationFrame: (callback: FrameRequestCallback) => number,
    cancelAnimationFrame: (id: number) => void,
] {
    return [
        (callback) => requestAnimationFrame(clock(), callback),
        (id: number) => cancelAnimationFrame(clock(), id),
    ];
}
