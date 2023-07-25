/**
 * @license Apache-2.0
 * @module
 */
import Gtk from "gi://Gtk?version=4.0";
import type Pango from "gi://Pango?version=1.0";
import type Gio from "gi://Gio?version=2.0";
import type Gdk from "gi://Gdk?version=4.0";
import {
    GtkWidgetProps,
    GtkAccessibleProps,
    GtkEditableProps,
    RefAble,
} from "./common.js";
import { Component } from "../index.js";
import { Widget, useWidget } from "../widget.jsx";

export type EntryProps<T extends Gtk.Entry = Gtk.Entry> = {
    activatesDefault?: boolean;
    attributes?: Pango.AttrList;
    buffer?: Gtk.EntryBuffer;
    enableEmojiCompletion?: boolean;
    extraMenu?: Gio.MenuModel;
    hasFrame?: boolean;
    imModule?: string;
    inputHints?: Gtk.InputHints;
    inputPurpose?: Gtk.InputPurpose;
    invisibleChar?: number;
    invisibleCharSet?: boolean;
    maxLength?: number;
    overwriteMode?: boolean;
    placeholderText?: string;
    primaryIconActivatable?: boolean;
    primaryIconGicon?: Gio.Icon;
    primaryIconName?: string;
    primaryIconPaintable?: Gdk.Paintable;
    primaryIconSensitive?: boolean;
    primaryIconTooltipMarkup?: boolean;
    primaryIconTooltipText?: string;
    progressFraction?: number;
    progressPulseStep?: number;
    scrollOffset?: number;
    secondaryIconActivatable?: boolean;
    secondaryIconGicon?: Gio.Icon;
    secondaryIconName?: string;
    secondaryIconPaintable?: Gdk.Paintable;
    secondaryIconSensitive?: boolean;
    secondaryIconTooltipMarkup?: boolean;
    secondaryIconTooltipText?: string;
    showEmojiIcon?: boolean;
    tabs?: Pango.TabArray;
    truncateMultiline?: boolean;
    visibility?: boolean;

    // Signals
    /**
     * 
     * @param self 
     * @returns 
     * @event
     */
    onActivate?: (self: T) => void;
    /**
     * 
     * @param self 
     * @param iconPos 
     * @returns 
     * @event
     */
    onIconPress?: (self: T, iconPos: Gtk.EntryIconPosition) => void;
    /**
     * 
     * @param self 
     * @param iconPos 
     * @returns 
     * @event
     */
    onIconRelease?: (self: T, iconPos: Gtk.EntryIconPosition) => void;
} & GtkWidgetProps<T> &
    GtkAccessibleProps &
    GtkEditableProps<T>;

/**
 * 
 * @param props 
 * @returns 
 * @group Components
 */
export const Entry: Component<EntryProps> = (props) => {
    return <Widget Widget={Gtk.Entry} {...props} />;
};

export type PasswordEntryProps<T extends Gtk.PasswordEntry = Gtk.PasswordEntry> = {
    activatesDefault?: boolean;
    extraMenu?: Gio.MenuModel;
    placeholderText?: string;
    showPeekIcon?: boolean;

    // Signals
    /**
     * 
     * @param self 
     * @returns 
     * @event
     */
    onActivate?: (self: T) => void;
} & GtkWidgetProps<T> &
    GtkAccessibleProps &
    GtkEditableProps<T> & RefAble<T>;

/**
 * 
 * @group Components
 */
export const PasswordEntry: Component<PasswordEntryProps> = (props) => {
    return useWidget(Gtk.PasswordEntry, props as unknown as Record<string, unknown>);
};
