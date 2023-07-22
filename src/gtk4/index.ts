/**
 * SPDX: Apache-2.0
 */
import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio?version=2.0";
import GObject from "gi://GObject?version=2.0";
import { start, createContext, useContext, applyContext } from "../reactive.js";
import { SessionStorage } from "../storage.js";
import { disconnectOnCleanup, registeredGClass } from "../gobject.js";
import { Accessor, createMemo, onMount } from "../index.js";
import { useWindow } from "./windows.jsx";
import { createStore } from "../store.js";

export * from "./buttons.jsx";

export * from "./containers.jsx";

export * from "./displays.jsx";

export * from "./entries.jsx";

export * from "./windows.jsx";

export const ApplicationContext =
    /* @__PURE__ */ createContext<Gtk.Application>();

export function useApplication(): Gtk.Application {
    const app = useContext(ApplicationContext);
    if (!app) {
        throw new ReferenceError("no application on tree");
    }
    return app;
}

interface GtkApplicationConfig {
    applicationId: string;
    flags?: Gio.ApplicationFlags;
}

@registeredGClass({})
export class GSolidApplication extends Gtk.Application {
    sessionStorage: SessionStorage;

    constructor(config?: Gtk.Application.ConstructorProperties) {
        super(config);
        this.sessionStorage = new SessionStorage();
    }
}

/**
 * Wrap application in a Gtk.Application.
 *
 * @param config
 * @param code the code will be executed in "activate" and reactive context.
 * @returns a class extends {@link Gtk.Application}
 */
export function wrapApp(
    config: GtkApplicationConfig,
    code: (app: GSolidApplication) => void
): typeof GSolidApplication {
    return GObject.registerClass(
        class extends GSolidApplication {
            private disposer: (() => void) | undefined;

            constructor() {
                super({
                    application_id: config.applicationId,
                    flags: config.flags ?? Gio.ApplicationFlags.DEFAULT_FLAGS,
                });
                this.disposer = undefined;
            }

            vfunc_startup(): void {
                super.vfunc_startup();
            }

            vfunc_activate(): void {
                super.vfunc_activate();

                this.hold();

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
    );
}

export interface MediaQueryData {
    readonly height: number;
    readonly width: number;
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

export function useMediaQuery(): MediaQueryData;

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
