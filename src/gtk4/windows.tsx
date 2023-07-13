/**
 * SPDX: Apache-2.0
 */

import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import { GtkAccessibleProps, GtkWidgetProps, RefAble } from "./common.js";
import {
    Component,
    JSX,
    children,
    createRenderEffect,
    onMount,
    splitProps,
} from "../index.js";
import { forwardRef, useWidget } from "../widget.jsx";

type WindowProps<T extends Gtk.Window = Gtk.Window> = {
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
    onActivateDefaullt?: (self: T) => void;
    onActivateFocus?: (self: T) => void;
    onCloseRequest?: (self: T) => boolean;
    onEnableDebugging?: (self: T, toggle: boolean) => boolean;
} & GtkWidgetProps<T> &
    GtkAccessibleProps &
    RefAble<T>;

export const Window: Component<WindowProps> = (props) => {
    const [p, rest] = splitProps(props, ["children"]);
    const node: Gtk.Window = useWidget(Gtk.Window, rest);
    const child = children(() => p.children);
    createRenderEffect(() => {
        const c = child();
        if (c) {
            node.set_child(c);
        } else {
            node.set_child(null);
        }
    });
    return node;
};

/**
 * Reactive window additionally receives `open` property to open or close winodw.
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
 * <ReactiveWindow open={isOpen()} onCloseRequest={() => setIsOpen(x => !x)} />
 * ````
 * 
 * Once the window is referenced 
 */
export const ReactiveWindow: Component<WindowProps & { open: boolean }> = (
    props
) => {
    const [p, rest] = splitProps(props, ["ref", "open"]);
    let ref: Gtk.Window;

    onMount(() => {
        const currentOpen = ref.is_visible();
        if (currentOpen) {
            if (!p.open) {
                ref.present();
            }
        } else {
            if (p.open) {
                ref.close();
            }
        }
    });

    return <Window ref={(r) => (ref = forwardRef(r, p.ref))} {...rest} />;
};
