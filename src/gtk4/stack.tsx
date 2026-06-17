import Gtk from "gi://Gtk?version=4.0";
import {
  GtkAccessibleProps,
  GtkOrientableProps,
  GtkWidgetProps,
  RefAble,
} from "./common.js";
import { createWidget, forwardRef } from "../widget.js";

export type StackProps<T extends Gtk.Stack> = GtkAccessibleProps &
  GtkWidgetProps<T> &
  RefAble<T> & {};

/**
 * Shows one of its children at a time.
 *
 * @example ```tsx
 * const Spam = () => {
 *   const stack = <Stack />;
 *   const mainPageId = createUniqueId();
 *   stack.add_titled(<Main />, mainPageId, "Main");
 *   return stack;
 * };
 * ```
 *
 * @link https://docs.gtk.org/gtk4/class.Stack.html
 * @group components
 */
export const Stack = (props: StackProps<Gtk.Stack>) => {
  return createWidget(Gtk.Stack, props);
};

export type StackSwitcherProps<T extends Gtk.StackSwitcher> =
  GtkWidgetProps<T> &
    GtkAccessibleProps &
    GtkOrientableProps &
    RefAble<T> & {
      stack: Gtk.Stack;
    };

/**
 * Shows a row of buttons to switch between GtkStack pages.
 *
 * @link https://docs.gtk.org/gtk4/class.StackSwitcher.html
 * @group components
 */
export const StackSwitcher = (props: StackSwitcherProps<Gtk.StackSwitcher>) => {
  return createWidget(Gtk.StackSwitcher, props);
};

export type StackSidebarProps<T extends Gtk.StackSidebar> = GtkWidgetProps<T> &
  GtkAccessibleProps &
  RefAble<T> & {
    stack: Gtk.Stack;
  };

/**
 * Uses a sidebar to switch between GtkStack pages.
 *
 * @link https://docs.gtk.org/gtk4/class.StackSidebar.html
 */
export const StackSidebar = (props: StackSidebarProps<Gtk.StackSidebar>) => {
  return createWidget(Gtk.StackSidebar, props);
};
