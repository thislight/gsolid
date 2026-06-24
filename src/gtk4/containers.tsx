/**
 * @license Apache-2.0
 * @module
 */
import { createWidget, forwardRef } from "../widget.js";
import {
  Accessor,
  Component,
  JSX,
  Owner,
  Setter,
  children,
  createMemo,
  createRenderEffect,
  createRoot,
  createSignal,
  getOwner,
  onCleanup,
  splitProps,
} from "../index.js";
import Gtk from "gi://Gtk?version=4.0";
import GObject from "gi://GObject";
import {
  GtkAccessibleProps,
  GtkOrientableProps,
  GtkScrollableProps,
  GtkWidgetProps,
  RefAble,
} from "./common.js";
import { render } from "./index.js";

export * from "./stack.jsx";

export type BoxProps<T extends Gtk.Box = Gtk.Box> = {
  /**
   * The amount of space between children.
   */
  spacing?: number;

  /**
   * Whether the children should all be the same size.
   */
  homogeneous?: boolean;

  /**
   * The position of the baseline aligned widgets if extra space is available.
   */
  baselinePosition?: Gtk.BaselinePosition;

  children?: JSX.Element | JSX.ArrayElement;
} & GtkAccessibleProps &
  GtkOrientableProps &
  GtkWidgetProps<T> &
  RefAble<T>;

/**
 * The {@link Gtk.Box} widget arranges child widgets into a single row or column.
 *
 * @group Components
 */
export const Box: Component<BoxProps> = (props) => {
  const [p, rest] = splitProps(props, ["children", "ref"]);
  const childrenMemo = children(() => p.children);
  return createWidget(Gtk.Box, {
    ...rest,
    ref: (r) => {
      render(childrenMemo, r);
      forwardRef(r, p.ref);
    },
  });
};

export type CenterBoxPropBase<T extends Gtk.CenterBox = Gtk.CenterBox> = {
  baselinePosition?: Gtk.BaselinePosition;
  // shrinkCenterLast?: boolean
} & GtkWidgetProps<T> &
  GtkAccessibleProps &
  GtkOrientableProps &
  RefAble<T>;

export type CenterBoxProps<T extends Gtk.CenterBox = Gtk.CenterBox> = (
  | {
      startWidget?: Gtk.Widget;
      centerWidget?: Gtk.Widget;
      endWidget?: Gtk.Widget;
      start?: never;
      center?: never;
      end?: never;
    }
  | {
      startWidget?: never;
      centerWidget?: never;
      endWidget?: never;
      start?: Gtk.Widget;
      center?: Gtk.Widget;
      end?: Gtk.Widget;
    }
) &
  CenterBoxPropBase<T>;

/**
 * CenterBox arranges three children in a row, keeping the middle child centered as well as possible.
 *
 * @since Gtk 4.10
 * @group Components
 */
export const CenterBox = (props: CenterBoxProps) => {
  const [p, rest] = splitProps(props, ["start", "center", "end", "ref"]);

  return createWidget(Gtk.CenterBox, {
    ...rest,
    ref: (r) => {
      if (Object.hasOwn(props, "start")) {
        createRenderEffect(() => {
          r.set_start_widget(props.start || null);
        });
      }
      if (Object.hasOwn(props, "center")) {
        createRenderEffect(() => {
          r.set_center_widget(props.center || null);
        });
      }
      if (Object.hasOwn(props, "end")) {
        createRenderEffect(() => {
          r.set_end_widget(props.end || null);
        });
      }
      forwardRef(r, p.ref);
    },
  });
};

export type ScrolledWindowProps<
  T extends Gtk.ScrolledWindow = Gtk.ScrolledWindow,
> = {
  hasFrame?: boolean;
  kineticScrolling?: boolean;
  maxContentHeight?: number;
  minContentHeight?: number;
  maxContentWidth?: number;
  minContentWidth?: number;
  overlayScrolling?: boolean;
  propagateNaturalHeight?: boolean;
  propagateNaturalWidth?: boolean;
  windowPlacement?: Gtk.CornerType;
  children?: JSX.Element;
} & GtkWidgetProps<T> &
  GtkAccessibleProps &
  GtkScrollableProps &
  RefAble<T>;

/**
 * `ScrolledWindow` is a container that makes its child scrollable.
 *
 * @see https://gjs-docs.gnome.org/gtk40~4.0/gtk.scrolledwindow
 * @group Components
 */
export const ScrolledWindow = (props: ScrolledWindowProps) => {
  const [p, rest] = splitProps(props, ["children"]);

  return createWidget(Gtk.ScrolledWindow, {
    ...rest,
    get child() {
      return p.children;
    },
  });
};

export interface ItemBindedWidget<T extends GObject.Object> extends Gtk.Widget {
  get item(): T;
  set child(val: JSX.Element);
}

export type MapListItem<
  T extends GObject.Object,
  Widget extends ItemBindedWidget<T> = ItemBindedWidget<T>,
> = (item: Accessor<Widget | undefined>) => JSX.Element;

class GSolidListItemRoot<
  T extends GObject.Object,
  Widget extends ItemBindedWidget<T>,
> {
  dispose!: () => void;
  arg: Accessor<Widget | undefined>;
  setArg: Setter<Widget | undefined>;
  parent: Widget;

  constructor(
    owner: Owner,
    parent: Widget,
    mapItem: (item: Accessor<Widget | undefined>) => JSX.Element,
  ) {
    this.parent = parent;
    [this.arg, this.setArg] = createSignal<Widget | undefined>(parent, {
      equals: false,
    });
    createRoot((dispose) => {
      this.dispose = dispose;
      createRenderEffect(() => {
        parent.child = mapItem(this.arg);
      });
    }, owner);
  }
}

export class GSolidListViewFactory<
  T extends GObject.Object,
  Widget extends ItemBindedWidget<T>,
>
  extends Gtk.SignalListItemFactory
{
  static {
    GObject.registerClass(this);
  }

  private reactiveOwner: Owner;
  private mapItem: (item: Accessor<Widget | undefined>) => JSX.Element;
  private roots: GSolidListItemRoot<T, Widget>[] = [];
  private widgets: Widget[] = [];

  constructor(
    reactiveOwner: Owner,
    mapItem: (item: Accessor<Widget | undefined>) => JSX.Element,
  ) {
    super();
    this.reactiveOwner = reactiveOwner;
    this.mapItem = mapItem;
    this.connect("setup", (_, object) => {
      const listItem = object as Widget;
      const nroot = new GSolidListItemRoot(
        this.reactiveOwner,
        listItem,
        this.mapItem,
      );
      this.roots.push(nroot);
      this.widgets.push(listItem);
    });
    this.connect("bind", (_, object) => {
      const widget = object as Widget;
      const idx = this.assertWidgetExists(widget);
      const root = this.roots[idx];
      root.setArg(() => widget);
    });
    this.connect("unbind", (_, object) => {
      const widget = object as Widget;
      const idx = this.assertWidgetExists(widget);
      const root = this.roots[idx];
      root.setArg();
    });
    this.connect("teardown", (_, object) => {
      const widget = object as Widget;
      const idx = this.assertWidgetExists(widget);
      const root = this.roots[idx];
      this.roots.splice(idx, 1);
      this.widgets.splice(idx, 1);
      root.dispose();
    });
  }

  private assertWidgetExists(widget: Widget) {
    const idx = this.widgets.indexOf(widget);
    if (idx < 0) {
      console.debug("[GSolidListViewFactory]", "list item:", widget);
      throw new TypeError("list item is not registered");
    }
    return idx;
  }
}

export type BindedListItem<T extends GObject.Object> = Gtk.ListItem &
  ItemBindedWidget<T>;

export type BindedHeader<T extends GObject.Object> = Gtk.ListHeader &
  ItemBindedWidget<T>;

export type ListViewProps<
  T extends Gtk.ListView = Gtk.ListView,
  Item extends GObject.Object = GObject.Object,
> = {
  enableRubberband?: boolean;
  factory: (item: Accessor<BindedListItem<Item> | undefined>) => JSX.Element;
  /**
   * @since Gtk4.12
   */
  headerFactory?: (
    item: Accessor<BindedHeader<Item> | undefined>,
  ) => JSX.Element;
  model: Gtk.SelectionModel;
  showSeparators?: boolean;
  singleClickActivate?: boolean;
  // tabBehavior

  // Signals
  /**
   *
   * @param self
   * @param position
   * @returns
   * @event
   */
  onActivate: (self: T, position: number) => void;
} & GtkWidgetProps<T> &
  GtkAccessibleProps &
  GtkOrientableProps &
  GtkScrollableProps &
  RefAble<T>;

/**
 * ListView presents a large dynamic list of items.
 *
 * GSolid replace the widget factories with the reactive versions.
 * If you want to use the original `props.factory` or `props.headerFactory`, use {@link createWidget}:
 *
 * ```tsx
 * createWidget(Gtk.ListView, {})
 * ```
 *
 * @see {@link Box} is recommended for small amount of items.
 * @group Components
 */
export function ListView<Item extends GObject.Object>(
  props: ListViewProps<Gtk.ListView, Item>,
) {
  const [p, rest] = splitProps(props, ["factory", "headerFactory"]);

  const factory = createMemo(() => {
    return new GSolidListViewFactory<Item, BindedListItem<Item>>(
      getOwner()!,
      p.factory,
    );
  });

  const headerFactory = Object.hasOwn(p, "headerFactory")
    ? createMemo(() =>
        p.headerFactory
          ? new GSolidListViewFactory<Item, BindedHeader<Item>>(
              getOwner()!,
              p.headerFactory,
            )
          : undefined,
      )
    : undefined;

  const ref = createWidget(Gtk.ListView, {
    ...rest,
    get factory() {
      return factory();
    },
    ...(headerFactory
      ? {
          get headerFactory() {
            return headerFactory();
          },
        }
      : {}),
  });

  onCleanup(() => {
    // Workaround: force the GC cleaning the model and factories
    ref.model = null!;
    ref.factory = null!;
    if (ref.headerFactory) {
      ref.headerFactory = null!;
    }
  });

  return ref;
}

export type HeaderBarProps<T extends Gtk.HeaderBar = Gtk.HeaderBar> = {
  decorationLayout?: string;
  showTitleButtons?: boolean;
  titleWidget?: Gtk.Widget;
  start?: JSX.Element;
  end?: JSX.Element;
} & GtkWidgetProps<T> &
  GtkAccessibleProps &
  RefAble<T>;

/**
 *
 * @group Components
 */
export const HeaderBar: Component<HeaderBarProps> = (props) => {
  const [p, rest] = splitProps(props, ["start", "end", "ref"]);
  const trackingWidgets: Gtk.Widget[] = [];

  const startElements = children(() => p.start);
  const endElements = children(() => p.end);

  return createWidget(Gtk.HeaderBar, {
    ...rest,
    ref: (r) => {
      createRenderEffect(() => {
        for (const element of trackingWidgets) {
          r.remove(element);
        }
        trackingWidgets.splice(0, trackingWidgets.length);

        const starts = startElements.toArray();
        if (starts)
          for (const element of starts) {
            if (!element) break;
            r.pack_start(element);
            trackingWidgets.push(element);
          }

        const ends = endElements.toArray();
        if (ends)
          for (const element of ends) {
            if (!element) break;
            r.pack_end(element);
            trackingWidgets.push(element);
          }
      });
      forwardRef(r, p.ref);
    },
  });
};
