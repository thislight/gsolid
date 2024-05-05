/**
 * @license Apache-2.0
 * @module
 */
import { Widget, forwardRef } from "../widget.jsx";
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

    children?: JSX.Element;
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
    return (
        <Widget
            ref={(r) => render(childrenMemo, r)}
            Widget={Gtk.Box}
            {...rest}
        />
    );
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
          children?: never;
      }
    | {
          startWidget?: never;
          centerWidget?: never;
          endWidget?: never;
          children?:
              | [Gtk.Widget | null, Gtk.Widget | null, Gtk.Widget | null]
              | [Gtk.Widget | null, Gtk.Widget | null]
              | [Gtk.Widget | null]
              | [];
      }
) &
    CenterBoxPropBase<T>;

/**
 * CenterBox arranges three children in a row, keeping the middle child centered as well as possible.
 *
 * Using `children` property (instead of `*Widget` properties), it accepts five variants:
 *
 * - `undefined` or `[]`(array with zero item): reset all three children
 * - `[JSX.Element]`: the only element will be set as the center child
 * - `[JSX.Element, JSX.Element]`: the start and the center
 * - `[JSX.Element, JSX.Element, JSX.Element]`: the start, the center and the end
 *
 * Slots also accept `null`, `null` will reset corresponding child.
 *
 * @since Gtk 4.10
 * @group Components
 */
export const CenterBox: Component<CenterBoxProps> = (props) => {
    let ref: Gtk.CenterBox;
    const [p, rest] = splitProps(props, ["children", "ref"]);

    const setChildrenOnce = (
        start: Gtk.Widget | null,
        center: Gtk.Widget | null,
        end: Gtk.Widget | null
    ) => {
        ref.set_start_widget(start);
        ref.set_center_widget(center);
        ref.set_end_widget(end);
    };

    const elements = createMemo(() => p.children);

    createEffect(() => {
        const children = elements();
        if (children) {
            switch (children.length) {
                case 3: {
                    const [start, center, end] = children;
                    setChildrenOnce(start, center, end);
                    break;
                }
                case 2: {
                    const [start, center] = children;
                    setChildrenOnce(start, center, null);
                    break;
                }
                case 1: {
                    const [center] = children;
                    setChildrenOnce(null, center, null);
                    break;
                }
                default: {
                    setChildrenOnce(null, null, null);
                }
            }
        } else {
            setChildrenOnce(null, null, null);
        }
    });
    return (
        <Widget
            ref={(r) => (ref = forwardRef(r, p.ref))}
            Widget={Gtk.CenterBox}
            {...rest}
        />
    );
};

export type ScrolledWindowProps<
    T extends Gtk.ScrolledWindow = Gtk.ScrolledWindow
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
 * @link https://gjs-docs.gnome.org/gtk40~4.0/gtk.scrolledwindow
 * @group Components
 */
export const ScrolledWindow: Component<ScrolledWindowProps> = (props) => {
    const [p, rest] = splitProps(props, ["children"]);

    return <Widget Widget={Gtk.ScrolledWindow} {...rest} child={p.children} />;
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
export const ListView: Component<ListViewProps> = (props) => {
    return <Widget Widget={Gtk.ListView} ref={props.ref} {...props} />;
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
    let ref: Gtk.HeaderBar;
    const trackingWidgets: Gtk.Widget[] = [];

    const startElements = children(() => p.start);
    const endElements = children(() => p.end);

    return (
        <Widget
            ref={(r) => {
                createRenderEffect(() => {
                    for (const element of trackingWidgets) {
                        ref.remove(element);
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
            }}
            Widget={Gtk.HeaderBar}
            {...rest}
        />
    );
};
