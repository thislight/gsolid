/**
 * @license Apache-2.0
 * @module
 */
import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio?version=2.0";
import GObject from "gi://GObject?version=2.0";
import { createContext, useContext } from "../reactive.js";
import { SessionStorage } from "../storage.js";
import { disconnectOnCleanup } from "../gobject.js";
import {
  Accessor,
  createMemo,
  createRoot,
  createSignal,
  getOwner,
  type JSX,
} from "../index.js";
import { useWindow } from "./windows.jsx";
import { insert } from "../jsx-runtime.js";

export type * from "./common.js";

export * from "./buttons.jsx";

export * from "./containers.jsx";

export * from "./displays.jsx";

export * from "./entries.jsx";

export * from "./windows.jsx";

/**
 * Current application in running.
 *
 * It's automatically set for code run by {@link GSolidApp.render}.
 */
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
   * Created session storage.
   *
   * use {@link useSessionStorage} to get session storage.
   *
   * @see useSessionStorage
   */
  sessionStorage?: SessionStorage;
  private disposer?: () => void;

  constructor(config?: Gtk.Application.ConstructorProperties) {
    super(config);
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
      const owner = getOwner();
      owner!.context = { [ApplicationContext.id]: this };
      code(this);
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
   * The scale fator that maps from application coordinates to the actual device pixels.
   */
  readonly devicePixelRatio: number;
  /**
   * The color scheme user prefers. `null` when failed to detect one.
   */
  readonly prefersColorScheme: "dark" | "light" | null;
}

function readPerferredColorScheme(settings: Gtk.Settings) {
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

  const [getPrefersColorScheme, setPrefersColorScheme] = createSignal<
    "dark" | "light" | null
  >(settings ? readPerferredColorScheme(settings) : null);

  const updateColorScheme = (settings: Gtk.Settings) => {
    setPrefersColorScheme(readPerferredColorScheme(settings));
  };

  let trackingTheme = false;
  const trackTheme = () => {
    if (trackingTheme) return;
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
      trackingTheme = true;
    }
  };

  const [SurfaceSize, setSurfaceSize] = createSignal<
    Pick<MediaQueryData, "height" | "width" | "devicePixelRatio">
  >({
    height: window.defaultHeight,
    width: window.defaultWidth,
    devicePixelRatio: window.scaleFactor,
  });

  let trackingSurfaceLayout = false;
  const trackSurfaceLayout = () => {
    if (trackingSurfaceLayout) return;
    const surface = window.get_surface();
    trackGSignal(
      surface,
      surface.connect("layout", () => {
        setSurfaceSize({
          height: surface.height,
          width: surface.width,
          devicePixelRatio: surface.scaleFactor,
        });
      }),
    );
    trackingSurfaceLayout = true;
  };

  const wrapper = {
    get prefersColorScheme() {
      trackTheme();
      return getPrefersColorScheme();
    },
    get height() {
      trackSurfaceLayout();
      return SurfaceSize().height;
    },
    get width() {
      trackSurfaceLayout();
      return SurfaceSize().width;
    },
    get devicePixelRatio() {
      trackSurfaceLayout();
      return SurfaceSize().devicePixelRatio;
    },
  } satisfies MediaQueryData;

  if (filter) {
    return createMemo(() => filter(wrapper));
  } else {
    return wrapper;
  }
}

export function render(
  expr: () => JSX.Element | JSX.ArrayElement,
  mount: Gtk.Widget,
) {
  return createRoot((dispose) => {
    mount.connect("destroy", dispose);
    insert(mount, expr);
  });
}

/**
 * Get a session storage instance.
 *
 * The API designed in this way to allow unused part can be tree-shaking.
 *
 * @throws ReferenceError if {@link ApplicationContext} is not set
 */
export function useSessionStorage() {
  const app = useApplication();

  if (app.sessionStorage) {
    return app.sessionStorage;
  }

  const storage = new SessionStorage();
  app.sessionStorage = storage;
  return storage;
}
