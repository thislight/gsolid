/**
 * @license Apache-2.0
 * @module
 */
import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio?version=2.0";
import GObject from "gi://GObject?version=2.0";
import { start, createContext, useContext, applyContext } from "../reactive.js";
import { SessionStorage } from "../storage.js";
import { disconnectOnCleanup, registeredGClass } from "../gobject.js";
import { Accessor, createMemo, createRoot, onMount, type JSX } from "../index.js";
import { useWindow } from "./windows.jsx";
import { createStore } from "../store.js";
import { insert } from "../jsx-runtime.js";

export type * from "./common.js";

export * from "./buttons.jsx";

export * from "./containers.jsx";

export * from "./displays.jsx";

export * from "./entries.jsx";

export * from "./windows.jsx";

export const ApplicationContext =
    /* @__PURE__ */ createContext<Gtk.Application>();

/**
 * Get nearest {@link Gtk.Application} on tree.
 * 
 * @throws ReferenceError if {@link ApplicationContext} is set
 * @returns value from {@link ApplicationContext}
 */
export function useApplication(): Gtk.Application {
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
 * Override {@link vfunc_activate} and use {@link begin} to run your application.
 *
 * This class likes `window` or `document` for Web,
 * keeps multiple API entries for the application.
 */
@registeredGClass({})
export class GSolidApplication extends Gtk.Application {
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

    begin(code: (app: GSolidApplication) => void): void {
        this.disposer = start(() => {
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
    const prefersDarkScheme = settings.gtk_application_prefer_dark_theme;
    const themeName = settings.gtk_theme_name;
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

export function useMediaQuery<R>(filter?: (q: MediaQueryData) => R): MediaQueryData | Accessor<R> {
    const window = useWindow();
    const settings = Gtk.Settings.get_default();
    if (!settings) {
        console.warn(
            "Gtk.Settings.get_default() gets null, could not detect dark theme."
        );
    }
    const trackGSignal = disconnectOnCleanup([]);
    const [data, setData] = createStore<MediaQueryData>({
        height: window.default_height,
        width: window.default_width,
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
            })
        );
        if (settings) {
            trackGSignal(
                settings,
                settings.connect(
                    "notify::gtk-application-prefer-dark-theme",
                    updateColorScheme
                )
            );
            trackGSignal(
                settings,
                settings.connect("notify::gtk-theme-name", updateColorScheme)
            );
        }
    });

    if (filter) {
        return createMemo(() => filter(data))
    } else {
        return data
    }
}

export function render(expr: () => JSX.Element, mount: Gtk.Widget) {
    return createRoot((dispose) => {
        mount.connect("destroy", dispose)
        insert(mount, expr);
    });
}
