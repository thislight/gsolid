/**
 * SPDX: Apache-2.0
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
    return ref
}

interface WidgetProps<T extends JSX.Element> {
    ref?: Ref<T>;
    Widget: new () => T;
    [key: string]: unknown;
}

/**
 * Create Gtk widgets as components.
 *
 * If you need a ref of the widget, consider {@link Widget}.
 *
 * @param widgetClass the widget constructor
 * @param props properties
 * @returns
 */
export function useWidget<T extends JSX.Element>(
    widgetClass: new () => T,
    props: { ref?: Ref<T>; [key: string]: unknown }
): T {
    const node = new widgetClass();
    spreadProps(node, props);
    forwardRef(node, props.ref);
    return node;
}

/**
 * This component wraps GTK widgets as a component.
 *
 * If you don't need a ref of the widget, consider {@link useWidget}.
 *
 * You can use {@link forwardRef} to forward references.
 */
export function Widget<T extends JSX.Element>(props: WidgetProps<T>): T {
    const [{ Widget: Klass }, rest] = splitProps(props, ["Widget"]);
    return useWidget(Klass, rest);
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
    props: DynamicProps<T>
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
