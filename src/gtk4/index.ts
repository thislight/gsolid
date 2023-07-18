/**
 * SPDX: Apache-2.0
 */
import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio?version=2.0";
import GObject from "gi://GObject?version=2.0";
import { start, createContext, useContext, applyContext } from "../reactive.js";

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

/**
 * Wrap application in a Gtk.Application.
 *
 * @param config
 * @param code the code will be executed in "activate" and reactive context.
 * @returns a class extends {@link Gtk.Application}
 */
export function wrapApp(
    config: GtkApplicationConfig,
    code: (app: Gtk.Application) => void
): typeof Gtk.Application {
    return GObject.registerClass(
        class extends Gtk.Application {
            disposer: (() => void) | undefined;

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
