import Gtk from "gi://Gtk?version=4.0";
import {
  GtkAccessibleProps,
  GtkOrientableProps,
  GtkWidgetProps,
  RefAble,
} from "./common.js";
import { createWidget } from "../widget.js";
import {
  JSX,
  splitProps,
  createContext,
  getOwner,
  useContext,
  untrack,
  onCleanup,
  createSignal,
  createRenderEffect,
} from "../index.js";

export type StackProps<T extends Gtk.Stack> = GtkAccessibleProps &
  GtkWidgetProps<T> &
  RefAble<T> & {
    children?: JSX.Element[];
  };

const StackContext = /* @__PURE__ */ createContext<Gtk.Stack | null>(null);

/**
 * Shows one of its children at a time.
 *
 * If `children` is specified, its element MUST be {@link StackPage}.
 *
 * Note: If your `children` is dynamic, the UI order may not reflect the elements' order.
 *
 * @example
 * ```tsx
 * const Spam = () => {
 *   const stack = <Stack />;
 *   const mainPageId = createUniqueId();
 *   stack.add_titled(<Main />, mainPageId, "Main");
 *   return stack;
 * };
 * ```
 *
 * @group Components
 */
export const Stack = (props: StackProps<Gtk.Stack>) => {
  const [p, rest] = splitProps(props, ["children"]);
  const ref = createWidget(Gtk.Stack, rest);
  getOwner()!.context[StackContext.id] = ref;
  createRenderEffect(() => {
    p.children;
  });
  return ref;
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
 * @group Components
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
 * @group Components
 */
export const StackSidebar = (props: StackSidebarProps<Gtk.StackSidebar>) => {
  return createWidget(Gtk.StackSidebar, props);
};

export type StackPageProps = {
  name: string;
  title: string;
  children: Gtk.Widget;
};

export const StackPage = (props: StackPageProps) => {
  const cx = useContext(StackContext);
  if (!cx) {
    throw new TypeError("<StackPage /> must be used under <Stack />");
  }
  const [ref, setRef] = createSignal<Gtk.StackPage>();

  createRenderEffect(() => {
    getOwner()!.context[StackContext.id] = null;
    const name = untrack(() => props.name);
    const title = untrack(() => props.title);
    const c = props.children;

    setRef(cx.add_titled(c, name, title));

    onCleanup(() => cx.remove(c));
  });

  createRenderEffect(() => {
    const r = ref();
    if (!r) return;

    if (props.name !== r.name) {
      r.name = props.name;
    }
  });

  createRenderEffect(() => {
    const r = ref();
    if (!r) return;

    if (props.title !== r.title) {
      r.title = props.title;
    }
  });

  return <></>;
};
