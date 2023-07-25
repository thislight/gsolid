/**
 * @license Apache-2.0
 * @module
 */
import { useWidget } from "../widget.jsx";
import { Component, JSX, mergeProps, splitProps } from "../index.js";
import Gtk from "gi://Gtk?version=4.0";
import { GtkWidgetProps, GtkAccessibleProps, RefAble } from "./common.js";

export type ButtonPropBase = {
    /**
     * 
     * @param e 
     * @returns 
     * @event
     */
    onClicked?: (e: Gtk.Button) => void;
    /**
     * 
     * @param e 
     * @returns 
     * @event
     */
    onActivate?: (e: Gtk.Button) => void;
    iconName?: string;
    hasFrame?: string;
    canShrink?: boolean;
    useUnderline?: boolean;
} & GtkWidgetProps<Gtk.Button> &
    GtkAccessibleProps &
    RefAble<Gtk.Button>;

export type ButtonProps = (
    | { label?: string; children?: undefined }
    | { children?: JSX.Element; label?: undefined }
) &
    ButtonPropBase;

/**
 *
 * @group Components
 */
export const Button: Component<ButtonProps> = (props) => {
    const [p, rest] = splitProps(props, ["children"]);
    return useWidget(
        Gtk.Button,
        mergeProps(
            {
                get child() {
                    return p.children;
                },
            },
            rest
        )
    );
};

export type CheckButtonPropBase<T extends Gtk.CheckButton = Gtk.CheckButton> = {
    active?: boolean;
    group?: T;
    inconsistent?: boolean;
    useUnderline?: boolean;
    // Signals
    /**
     * 
     * @param e 
     * @returns 
     * @event
     */
    onActivate?: (e: T) => void;
    /**
     * 
     * @param e 
     * @returns 
     * @event
     */
    onToggled?: (e: T) => void;
} & GtkWidgetProps<T> &
    GtkAccessibleProps &
    RefAble<T>;

export type CheckButtonProps<T extends Gtk.CheckButton = Gtk.CheckButton> = (
    | { children?: JSX.Element; label?: undefined }
    | { label?: string; children?: undefined }
) &
    CheckButtonPropBase<T>;

/**
 * A CheckButton places a label next to an indicator.
 *
 * ## Stateful Widget
 *
 * The GTK CheckButton is stateful and the `onToggled` will be triggered when the `active` changed.
 * If you update the button within the widget signal callback,
 * The stack may be overflow.
 *
 * ````typescript
 * const [active, setActive] = createSignal(false)
 *
 * <CheckButton active={active()} onToggled={() => setActive(x => !x)} />
 * ````
 *
 * In the example above, the active property will be changed when `onToggled` triggered,
 * and the `onToggled` will be triggered again. This infinite loop will be failed when stack overflow.
 *
 * For similar behaviour, you can set the active property only when the widget initialising, with `untrack`.
 * This will work:
 *
 * ````tsx
 * <CheckButton active={untrack(active)} onToggled={() => setActive(x => !x)} />
 * ````
 *
 * ## (Radio) Group
 * To utilise `group` property, pass a {@link Gtk.CheckButton} in the group.
 *
 * ````tsx
 * let ref: Gtk.CheckButton
 *
 * <CheckButton ref={ref!} label="Check 1" />
 * <CheckButton group={ref} label="Check 2" />
 * <CheckButton group={ref} label="Check 3" />
 * ````
 * @group Components
 */
export const CheckButton: Component<CheckButtonProps> = (props) => {
    const [p, rest] = splitProps(props, ["children"]);
    return useWidget(
        Gtk.CheckButton,
        mergeProps(
            {
                get child() {
                    return p.children;
                },
            },
            rest
        )
    );
};
