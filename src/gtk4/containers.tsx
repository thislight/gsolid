/**
 * SPDX: Apache-2.0
 */
import { Widget, forwardRef } from "../widget.jsx";
import {
    Component,
    JSX,
    children,
    createEffect,
    createMemo,
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

type BoxProps<T extends Gtk.Box = Gtk.Box> = {
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

    children?: JSX.Element | JSX.Element[];
} & GtkAccessibleProps &
    GtkOrientableProps &
    GtkWidgetProps<T> &
    RefAble<T>;

/**
 * The {@link Gtk.Box} widget arranges child widgets into a single row or column.
 */
export const Box: Component<BoxProps> = (props) => {
    const [p, rest] = splitProps(props, ["children", "ref"]);
    let ref: Gtk.Box;
    const childrenMemo = children(() => p.children);
    createEffect(() => {
        const elements = childrenMemo.toArray();
        let child: Gtk.Widget | null = ref.get_first_child();
        while (child) {
            const current = child;
            child = child.get_next_sibling();
            ref.remove(current);
        }
        if (elements) {
            for (const child of elements) {
                ref.append(child);
            }
        }
    });
    return (
        <Widget
            ref={(r) => (ref = forwardRef(r, p.ref))}
            Widget={Gtk.Box}
            {...rest}
        />
    );
};

type CenterBoxPropBase<T extends Gtk.CenterBox = Gtk.CenterBox> = {
    baselinePosition?: Gtk.BaselinePosition;
    // shrinkCenterLast?: boolean
} & GtkWidgetProps<T> &
    GtkAccessibleProps &
    GtkOrientableProps &
    RefAble<T>;

type CenterBoxProps<T extends Gtk.CenterBox = Gtk.CenterBox> = (
    | {
          startWidget?: JSX.Element;
          centerWidget?: JSX.Element;
          endWidget?: JSX.Element;
          children?: undefined;
      }
    | {
          startWidget?: undefined;
          centerWidget?: undefined;
          endWidget?: undefined;
          children?:
              | [JSX.Element | null, JSX.Element | null, JSX.Element | null]
              | [JSX.Element | null, JSX.Element | null]
              | [JSX.Element | null]
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

    const elements = createMemo(() => p.children)

    createEffect(() => {
        const children = elements()
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

type ScrolledWindowProps<T extends Gtk.ScrolledWindow = Gtk.ScrolledWindow> = {
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

export const ScrolledWindow: Component<ScrolledWindowProps> = (props) => {
    const [p, rest] = splitProps(props, ["children"]);

    return (
        <Widget
            Widget={Gtk.ScrolledWindow}
            {...rest}
            child={p.children}
        />
    );
};

type ListViewProps<T extends Gtk.ListView = Gtk.ListView> = {
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
 */
export const ListView: Component<ListViewProps> = (props) => {
    return <Widget Widget={Gtk.ListView} ref={props.ref} {...props} />;
};

type HeaderBarProps<T extends Gtk.HeaderBar = Gtk.HeaderBar> = {
    decorationLayout?: string;
    showTitleButtons?: boolean;
    titleWidget?: Gtk.Widget;
    start?: JSX.Element[];
    end?: JSX.Element[];
} & GtkWidgetProps<T> &
    GtkAccessibleProps &
    RefAble<T>;

export const HeaderBar: Component<HeaderBarProps> = (props) => {
    const [p, rest] = splitProps(props, ["start", "end", "ref"]);
    let ref: Gtk.HeaderBar;
    const trackingWidgets: JSX.Element[] = [];
    
    const startElements = children(() => p.start)
    const endElements = children(() => p.end)

    createEffect(() => {
        for (const element of trackingWidgets) {
            ref.remove(element);
        }
        trackingWidgets.splice(0, trackingWidgets.length);
        
        const starts = startElements.toArray()
        if (starts)
            for (const element of starts) {
                ref.pack_start(element);
                trackingWidgets.push(element);
            }

        const ends = endElements.toArray()
        if (ends)
            for (const element of ends) {
                ref.pack_end(element);
                trackingWidgets.push(element);
            }
    });
    return (
        <Widget
            ref={(r) => (ref = forwardRef(r, p.ref))}
            Widget={Gtk.HeaderBar}
            {...rest}
        />
    );
};
