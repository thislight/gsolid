/**
 * @license Apache-2.0
 * @module
 */
import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio?version=2.0";
import GObject from "gi://GObject?version=2.0";
import { createContext, useContext, applyContext } from "../reactive.js";
import { SessionStorage } from "../storage.js";
import { disconnectOnCleanup } from "../gobject.js";
import {
    Accessor,
    createMemo,
    createRoot,
    onMount,
    type JSX,
} from "../index.js";
import { useWindow } from "./windows.jsx";
import { createStore } from "../store.js";
import { insert } from "../jsx-runtime.js";

export type * from "./common.js";

export * from "./buttons.jsx";

export * from "./containers.jsx";

export * from "./displays.jsx";

export * from "./entries.jsx";

export * from "./windows.jsx";

export const ApplicationContext = /* @__PURE__ */ createContext<GSolidApp>();

/**
 * Get nearest {@link Gtk.Application} on tree.
 *
 * @throws ReferenceError if {@link ApplicationContext} is set
 * @returns value from {@link ApplicationContext}
 */
export function useApplication(): GSolidApp {
    const app = useContext(ApplicationContext);
    if (!app) {
        throw new ReferenceError("no application on tree");
    }
    return app;
}

export interface GtkApplicationConfig {
    applicationId: string;
    flags?: Gio.ApplicationFlags;
}

/**
 * Custom {@link Gtk.Application} for GSolid applications.
 *
 * Override {@link vfunc_activate} and use {@link render} to run your application.
 *
 * This class likes `window` or `document` for Web,
 * keeps multiple API entries for the application.
 */
export class GSolidApp extends Gtk.Application {
    static {
        GObject.registerClass({}, this);
    }

    /**
     * The session storage. The data in this storage is only available during the application running.
     */
    sessionStorage: SessionStorage;
    private disposer?: () => void;

    constructor(config?: Gtk.Application.ConstructorProperties) {
        super(config);
        this.sessionStorage = new SessionStorage();
    }

    vfunc_startup(): void {
        super.vfunc_startup();
    }

    /**
     * Render your application.
     *
     * You can call it multiple times at any time (as application activated),
     * every call will dispose the last rendering.
     *
     * ```ts
     * class MyApp extends GSolidApp {
     *  override vfunc_startup() {
     *      super.vfunc_startup();
     *
     *      this.render(() => <Window open>
     *          <Label label="Hello World" />
     *      </Window>);
     *  }
     * }
     * ```
     */
    render(code: (app: GSolidApp) => void): void {
        if (this.disposer) {
            const disposer = this.disposer;
            disposer();
        }

        createRoot((dispose) => {
            this.disposer = dispose;
            applyContext(ApplicationContext, this, () => {
                code(this);
            })();
        });
    }

    vfunc_shutdown(): void {
        super.vfunc_shutdown();

        if (this.disposer) {
            const disposer = this.disposer;
            disposer();
        }
    }
}

export interface MediaQueryData {
    /**
     * The acutal height of the current window.
     */
    readonly height: number;
    /**
     * The actual width of the current window.
     */
    readonly width: number;
    /**
     * The color scheme user prefers. `null` when failed to detect one.
     */
    readonly prefersColorScheme: "dark" | "light" | null;
}

function getPerferredColorScheme(settings: Gtk.Settings) {
    const prefersDarkScheme = settings.gtkApplicationPreferDarkTheme;
    const themeName = settings.gtkThemeName;
    if (prefersDarkScheme) {
        return "dark";
    } else if (themeName !== null) {
        return themeName.toLowerCase().includes("dark") ? "dark" : "light";
    } else {
        return null;
    }
}

/**
 * Get reactive infomation about the nearest window on tree and user preferences.
 *
 * @returns the media query data
 */
export function useMediaQuery(): MediaQueryData;

/**
 * Get reactive infomation about the nearest window on tree and user preferences.
 *
 * @param filter return filtered data if specified
 * @returns the data transformed by the filter
 */
export function useMediaQuery<R>(filter: (q: MediaQueryData) => R): Accessor<R>;

export function useMediaQuery<R>(
    filter?: (q: MediaQueryData) => R,
): MediaQueryData | Accessor<R> {
    const window = useWindow();
    const settings = Gtk.Settings.get_default();
    if (!settings) {
        console.warn(
            "Gtk.Settings.get_default() gets null, could not detect dark theme.",
        );
    }
    const trackGSignal = disconnectOnCleanup([]);
    const [data, setData] = createStore<MediaQueryData>({
        height: window.defaultHeight,
        width: window.defaultWidth,
        prefersColorScheme: settings ? getPerferredColorScheme(settings) : null,
    });
    const updateColorScheme = (settings: Gtk.Settings) => {
        setData({
            prefersColorScheme: getPerferredColorScheme(settings),
        });
    };

    onMount(() => {
        const surface = window.get_surface();
        trackGSignal(
            surface,
            surface.connect("layout", () => {
                setData({
                    height: surface.height,
                    width: surface.width,
                });
            }),
        );
        if (settings) {
            trackGSignal(
                settings,
                settings.connect(
                    "notify::gtk-application-prefer-dark-theme",
                    updateColorScheme,
                ),
            );
            trackGSignal(
                settings,
                settings.connect("notify::gtk-theme-name", updateColorScheme),
            );
        }
    });

    if (filter) {
        return createMemo(() => filter(data));
    } else {
        return data;
    }
}

export function render(expr: () => JSX.Element, mount: Gtk.Widget) {
    return createRoot((dispose) => {
        mount.connect("destroy", dispose);
        insert(mount, expr);
    });
}
