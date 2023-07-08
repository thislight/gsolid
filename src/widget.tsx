/**
 * SPDX: Apache-2.0
 */
import {
    Ref,
    splitProps,
    JSX,
    spreadProps,
    ComponentProps,
    createRenderEffect,
    ValidComponent,
    createMemo,
    untrack,
} from "./index.js";

interface WidgetProps<T extends JSX.Element> {
    ref?: Ref<T>;
    Widget: new () => T;
    [key: string]: unknown;
}

/**
 * Create Gtk widgets as components.
 * @param widgetClass the widget constructor
 * @param props properties
 * @returns 
 */
export function useWidget<T extends JSX.Element>(
    widgetClass: new () => T,
    props: { ref?: Ref<T>; [key: string]: unknown }
) {
    const node = new widgetClass();
    spreadProps(node, props);
    /* Patch to work with `ref` */
    if (props.ref) {
        const ref = props.ref;
        if (typeof ref == "function") {
            createRenderEffect(() => ref(node))
        }
    }
    return node;
}

/**
 * This component wraps GTK widgets as a component.
 */
export function Widget<T extends JSX.Element>(props: WidgetProps<T>) {
    const [{ Widget: Klass }, rest] = splitProps(props, ["Widget"]);
    return useWidget(Klass, rest);
}

export type DynamicProps<T extends ValidComponent, P = ComponentProps<T>> = {
    [K in keyof P]: P[K];
} & {
    component: T | undefined;
};

/**
 *
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
        return untrack(() => component(rest));
    }) as unknown as JSX.Element; // This can work under jsx context
}
