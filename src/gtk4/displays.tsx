/**
 * @license Apache-2.0
 * @module
 */
import { Widget } from "../widget.jsx";
import { Component } from "../index.js";
import Gtk from "gi://Gtk?version=4.0";

import { GtkWidgetProps, GtkAccessibleProps, RefAble } from "./common.js";

export type LabelProps<T extends Gtk.Label = Gtk.Label> = {
    label?: string;
    // TODO: ellipsize
    // TODO: extraMenu
    justify?: Gtk.Justification;
    lines?: number;
    maxWidthChars?: number;
    widthChars?: number;
    mnemonicKeyval?: number;
    // TODO: mnemonicWidget?: Gtk.Widget (This prop should be able to use component)
    naturalWrapMode?: Gtk.NaturalWrapMode;
    selectable?: boolean;
    singleLineMode?: boolean;
    // TODO: tabs
    useMarkup?: boolean;
    useUnderline?: boolean;
    wrap?: boolean;
    // TODO: wrapMode
    xalign?: number;
    yalign?: number;

    // Signals
    /**
     * 
     * @param e 
     * @returns 
     * @event
     */
    onActivateCurrentLink?: (e: T) => void;
    /**
     * Gets emitted to activate a URI.
     * Applications may connect to it to override the default behaviour, which is to call gtk_file_launcher_launch().
     * @param uri The URI that is activated.
     * @returns TRUE if the link has been activated.
     * @event
     */
    onActivateLink?: (e: T, uri: string) => boolean;
    /**
     * 
     * @param e 
     * @returns 
     * @event
     */
    onCopyClipboard?: (e: T) => void;
} & GtkWidgetProps<T> &
    GtkAccessibleProps &
    RefAble<T>;

/**
 * Text block for small amount of text.
 * @group Components
 */
export const Label: Component<LabelProps> = (props) => {
    return <Widget ref={props.ref} Widget={Gtk.Label} {...props} />;
};

export type SpinnerProps<T extends Gtk.Spinner = Gtk.Spinner> = {
    spinning?: boolean;
} & GtkWidgetProps<T> &
    GtkAccessibleProps &
    RefAble<T>;

/**
 *
 * @group Components
 */
export const Spinner: Component<SpinnerProps> = (props) => {
    return <Widget ref={props.ref} Widget={Gtk.Spinner} {...props} />;
};

export type ProgressBarProps<T extends Gtk.ProgressBar = Gtk.ProgressBar> = {
    // ellipsize
    fraction?: number;
    inverted?: boolean;
    pulseStep?: number;
    showText?: boolean;
    text?: string;
} & GtkWidgetProps<T> &
    GtkAccessibleProps &
    RefAble<T>;

/**
 *
 * @group Components
 */
export const ProgressBar: Component<ProgressBarProps> = (props) => {
    return <Widget ref={props.ref} Widget={Gtk.ProgressBar} {...props} />;
};
