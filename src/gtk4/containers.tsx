/**
 * @license Apache-2.0
 * @module
 */
import { createWidget, forwardRef } from "../widget.js";
import {
  Component,
  JSX,
  children,
  createEffect,
  createMemo,
  createRenderEffect,
  splitProps,
} from "../index.js";
import Gtk from "gi://Gtk?version=4.0";
import {
  GtkAccessibleProps,
  GtkOrientableProps,
  GtkScrollableProps,
  GtkWidgetProps,
  RefAble,
} from "./common.js";
import { render } from "./index.js";

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

export type ListViewProps<T extends Gtk.ListView = Gtk.ListView> = {
  enableRubberband?: boolean;
  factory: Gtk.ListItemFactory;
  /**
   * @since Gtk4.12
   */
  headerFactory?: Gtk.ListItemFactory;
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
 * {@link Box} is recommended for small amount of items.
 * @group Components
 */
export const ListView = (props: ListViewProps) => {
  return createWidget(Gtk.ListView, props);
};

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
