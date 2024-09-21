/**
 * @license Apache-2.0
 * @module
 */
import {
    Ref,
} from "../index.js";
import Gtk from "gi://Gtk?version=4.0";

export interface RefAble<T extends Gtk.Widget> {
    ref?: Ref<T>;
}

export interface GtkWidgetProps<T extends Gtk.Widget> {
    valign?: Gtk.Align;
    halign?: Gtk.Align;
    canFocus?: boolean;
    canTarget?: boolean;
    cssClasses?: string[];
    // TODO: cursor (Gtk.Cursor is not exported?)
    focusOnClick?: boolean;
    focusable?: boolean;
    hasDefault?: boolean;
    hasFocus?: boolean;

    /**
     * Control the emission of the ::query-tooltip signal on widget
     */
    hasTooltip?: boolean;

    /**
     * Override for height request of the widget.
     * If this is -1, the natural request will be used.
     */
    heightRequest?: number;
    /**
     * Override for width request of the widget.
     * If this is -1, the natural request will be used.
     */
    widthRequest?: number;

    /**
     * Whether to expand horizontally
     */
    hexpand?: boolean;
    /**
     * Whether to use the `hexpand` property
     */
    hexpandSet?: boolean;
    /**
     * Whether to expand vertically.
     */
    vexpand?: boolean;
    /**
     * Whether to use the vexpand property.
     */
    vexpandSet?: boolean;

    layoutManager?: Gtk.LayoutManager;

    marginBottom?: number;
    marginEnd?: number;
    marginStart?: number;
    marginTop?: number;

    name?: string;

    opacity?: number;

    overflow?: Gtk.Overflow;

    /**
     * Whether the widget will receive the default action when it is focused.
     */
    receivesDefault?: boolean;

    /**
     * Whether the widget responds to input.
     */
    sensitive?: boolean;

    tooltipMarkup?: string;
    tooltipText?: string;

    // Signals
    /**
     * Emitted when the widget is going to be destoried.
     * @param e 
     * @event
     * @see https://gjs-docs.gnome.org/gtk40~4.0/gtk.widget#signal-destroy
     */
    onDestory?: (e: T) => void;
    /**
     * Emitted when the text direction is changed.
     * @param e 
     * @param previousDirection 
     * @returns 
     * @event
     * @see https://gjs-docs.gnome.org/gtk40~4.0/gtk.widget#signal-direction-changed
     */
    onDirectionChanged?: (e: T, previousDirection: Gtk.TextDirection) => void;
    /**
     * 
     * @param e 
     * @returns 
     * @event
     * @see https://gjs-docs.gnome.org/gtk40~4.0/gtk.widget#signal-hide
     */
    onHide?: (e: T) => void;
    /**
     * Emitted if keyboard navigation fails.
     * @returns TRUE if stopping keyboard navigation is fine,
     * FALSE if the emitting widget should try to handle the keyboard navigation attempt in its parent widget(s).
     * @event
     * @see https://gjs-docs.gnome.org/gtk40~4.0/gtk.widget#signal-keynav-failed
     */
    onKeynavFailed?: (e: T, direction: Gtk.DirectionType) => boolean;
    /**
     * Emitted when the widget is going to be mapped.
     * @param e 
     * @returns 
     * @event
     * @see https://gjs-docs.gnome.org/gtk40~4.0/gtk.widget#signal-map
     */
    onMap?: (e: T) => void;
    /**
     * Emitted when a widget is activated via a mnemonic.
     * The default handler for this signal activates widget if group_cycling is FALSE, or just makes widget grab focus if group_cycling is TRUE.
     * @param e the widget
     * @param groupCycling TRUE if there are other widgets with the same mnemonic.
     * @returns TRUE to stop other handlers from being invoked for the event.
     * FALSE to propagate the event further.
     * @event
     * @see https://gjs-docs.gnome.org/gtk40~4.0/gtk.widget#signal-mnemonic-activate
     */
    onMnemonicActivate?: (e: T, groupCycling: boolean) => void;
    /**
     * Emitted when focus is moved.
     * @param e 
     * @param direction 
     * @returns 
     * @event
     * @see https://gjs-docs.gnome.org/gtk40~4.0/gtk.widget#signal-move-focus
     */
    onMoveFocus?: (e: T, direction: Gtk.DirectionType) => void;
    /**
     * Emitted when the widget’s tooltip is about to be shown.
     * This happens when the GtkWidget:has-tooltip property is TRUE and
     * the hover timeout has expired with the cursor hovering “above” widget; or emitted when widget got focus in keyboard mode.
     * Using the given coordinates, the signal handler should determine whether a tooltip should be shown for widget. If this is the case TRUE should be returned, FALSE otherwise. Note that if keyboard_mode is TRUE, the values of x and y are undefined and should not be used.
     * @param e the widget
     * @param x The x coordinate of the cursor position where the request has been emitted, relative to widget‘s left side.
     * @param y The y coordinate of the cursor position where the request has been emitted, relative to widget‘s top.
     * @param keyboardMode TRUE if the tooltip was triggered using the keyboard.
     * @param tooltip The data is owned by the caller of the function.
     * @returns TRUE if tooltip should be shown right now, FALSE otherwise.
     * @event
     * @see https://gjs-docs.gnome.org/gtk40~4.0/gtk.widget#signal-query-tooltip
     */
    onQueryTooltip?: (
        e: T,
        x: number,
        y: number,
        keyboardMode: boolean,
        tooltip: Gtk.Tooltip
    ) => boolean;
    /**
     * 
     * @param e 
     * @returns
     * @event
     * @see https://gjs-docs.gnome.org/gtk40~4.0/gtk.widget#signal-realize
     */
    onRealize?: (e: T) => void;
    /**
     * 
     * @param e 
     * @returns 
     * @event
     * @see https://gjs-docs.gnome.org/gtk40~4.0/gtk.widget#signal-show
     */
    onShow?: (e: T) => void;
    /**
     * 
     * @param e 
     * @param flags 
     * @returns 
     * @event
     * @see https://gjs-docs.gnome.org/gtk40~4.0/gtk.widget#signal-state-flags-changed
     */
    onStateFlagsChanged?: (e: T, flags: Gtk.StateFlags) => void;
    /**
     * 
     * @param e 
     * @returns 
     * @event
     * @see https://gjs-docs.gnome.org/gtk40~4.0/gtk.widget#signal-unmap
     */
    onUnmap?: (e: T) => void;
    /**
     * 
     * @param e 
     * @returns 
     * @event
     * @see https://gjs-docs.gnome.org/gtk40~4.0/gtk.widget#signal-unrealize
     */
    onUnrealize?: (e: T) => void;
}

export interface GtkAccessibleProps {
    accessibleRole?: Gtk.AccessibleRole;
}

export interface GtkOrientableProps {
    orientation?: Gtk.Orientation;
}

export interface GtkScrollableProps {
    hadjustment?: Gtk.Adjustment;
    vadjustment?: Gtk.Adjustment;
    hscrollPolicy?: Gtk.ScrollablePolicy;
    vscrollPolicy?: Gtk.ScrollablePolicy;
}

export interface GtkEditableProps<T extends Gtk.Widget> {
    /**
     * The current position of the insertion cursor in chars.
     */
    cursorPosition?: number;
    editable?: boolean;
    enableUndo?: boolean;
    maxWidthChars?: number;
    selectionBound?: number;
    text?: string;
    widthChars?: number;
    xalign?: number;

    // Signals
    /**
     * Emitted at the end of a single user-visible operation on the contents.
     * @event
     */
    onChanged?: (self: T) => void;
    /**
     * Emitted when text is deleted from the widget by the user.
     *
     * The default handler for this signal will normally be responsible for deleting the text,
     * so by connecting to this signal and then stopping the signal with g_signal_stop_emission(),
     * it is possible to modify the range of deleted text,
     * or prevent it from being deleted entirely.
     * @event
     */
    onDeleteText?: (self: T, startPos: number, endPos: number) => void;
    /**
     * Emitted when text is inserted into the widget by the user.
     *
     * The default handler for this signal will normally be responsible
     * for inserting the text, so by connecting to this signal and then
     * stopping the signal with GObject.signal_stop_emission, it is possible
     * to modify the inserted text, or prevent it from being inserted entirely.
     *
     * @returns the position, in characters, at which to insert the new text. this is an in-out parameter. After the signal emission is finished, it should point after the newly inserted text.
     * @event
     */
    onInsertText?: (self: T, text: string, length: number) => number;
}
