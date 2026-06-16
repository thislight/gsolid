/**
 * @license Apache-2.0
 * @module
 */
import {
  Ref,
  splitProps,
  JSX,
  spreadProps,
  ComponentProps,
  ValidComponent,
  createMemo,
  untrack,
  createRenderEffect,
} from "./index.js";

/**
 * Forward reference to the parent component.
 *
 * Only call this function once you actually got the reference!
 *
 * Do:
 * ````ts
 * const Spam = (props) => {
 *  const widget = new Gtk.Widget({})
 *  forwardRef(widget, props.ref)
 *  return widget
 * }
 * ````
 *
 * Don't:
 * ````jsx
 * const Foo = (props) => {
 *  let ref: Gtk.Widget
 *  forwardRef(ref, props.ref) // The ref is undefined at the moment!
 *  return <Widget Widget={Gtk.Widget} ref={ref!} />
 * }
 * ````
 *
 * Don't:
 * ````jsx
 * const Foo = (props) => {
 *  let ref: Gtk.Widget
 *  onMount(() => forwardRef(ref, props.ref))
 *  return <Widget Widget={Gtk.Widget} ref={ref!} />
 * }
 * ````
 *
 * onMount's callback is run after the render phase. It won't work as intended.
 *
 * Instead:
 * ````jsx
 * const Foo = (props) => {
 *  let ref: Gtk.Widget
 *  return <Widget Widget={Gtk.Widget} ref={(r) => ref = forwardRef(r, props.ref)} />
 * }
 * ````
 *
 * @param ref
 * @param forwardTo
 */
export function forwardRef<T>(ref: T, forwardTo?: Ref<T>): T {
  if (typeof forwardTo == "function") {
    // the ref passing in component is always a function
    (forwardTo as (ref: T) => void)(ref);
  }
  return ref;
}

export type WidgetProps<T extends {}> = Omit<Partial<T>, "ref"> & {
  ref?: Ref<T>;
};

/**
 * Create Gtk widgets as components.
 *
 * You can just pass received props or the result of `splitProps`, or you will lost reactivity.
 *
 * @param WidgetKlass the widget constructor
 * @param props properties
 * @returns
 */
export function createWidget<T extends {}>(
  WidgetKlass: new () => T,
  props: WidgetProps<T>,
): T {
  const node = new WidgetKlass();
  const [internal, rest] = splitProps(props, ["ref"]);
  createRenderEffect(() => spreadProps(node, rest));
  forwardRef(node, internal.ref);
  return node;
}

export type DynamicProps<T extends ValidComponent, P = ComponentProps<T>> = {
  [K in keyof P]: P[K];
} & {
  component: T | undefined;
};

/**
 * renders an arbitrary custom or native component and passes the other props
 * @param props
 * @returns
 */
export function Dynamic<T extends ValidComponent>(
  props: DynamicProps<T>,
): JSX.Element {
  const [p, rest] = splitProps(props, ["component"]);
  const cache = createMemo(() => p.component);
  return createMemo(() => {
    const component = cache();
    return untrack<JSX.Element>(() => component(rest));
  }) as unknown as JSX.Element;
}

/**
 * Test if two widget or widget array is equal.
 *
 * If `a` and `b` are arrays, checks if two arrays have same lengths and same elements.
 *
 * Equality test is `===`.
 *
 * @param a widget or widget array
 * @param b widget or widget array
 * @returns
 */
export function widgetEquals(a: unknown, b: unknown) {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length == b.length) {
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  } else {
    return a === b;
  }
}
