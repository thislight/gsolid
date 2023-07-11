import { Accessor, JSX, createMemo } from "./index.js";
import { widgetEquals } from "./widget.jsx";

function resolveChildren(c: any): any {
    if (typeof c === "function" && !c.length) {
        return resolveChildren((c as Function)());
    }
    return c;
}

export type ResolvedJSXElement = JSX.Element;
export type ResolvedChildren<T extends ResolvedJSXElement | undefined> =
    T extends undefined ? T : T | T[];
export type ChildrenResult<T extends ResolvedJSXElement | undefined> = Accessor<
    ResolvedChildren<T>
> & {
    toArray: () => ResolvedJSXElement[];
};
export type ChildrenAccessorResult<T, A extends T[] = T[]> = Accessor<T> & {
    toArray: () => A;
};

type AnyChildrenResult = Accessor<any> & { toArray: () => any };

export function children<T extends JSX.Element>(
    fn: Accessor<T | T[] | undefined>
): ChildrenResult<T>;

export function children<A>(
    fn: Accessor<Accessor<A>>
): ChildrenAccessorResult<A>;

/**
 * The helper function to consume children.
 *
 * The children in gsolid (and solid js) is lazy like other properties, by default. It won't be evaluated until it is being accessed.
 * It does not matter if you just pass the children to another component.
 *
 * When you are the one to consume the children, you must evaluate the children at render phase,
 * or bunch of things won't work, including the children's `ref` property.
 *
 * To evaluate the children, access the property in the render phase.
 *
 * ````ts
 * createRenderEffect(() => untrack(() => props.children))
 * createEffect(() => {
 *  doSomethingOn(props.children)
 * })
 * ````
 *
 * That will do, but not prefect. Since we consume the children, we read the children.
 * `createMemo` can help us do the trick.
 *
 * ````ts
 * const children = createMemo(() => props.children)
 *
 * createEffect(() => {
 *  doSomethingOn(children())
 * })
 * ````
 *
 * It's better. The children will be evaluated at render phase since `createMemo` use another low-level primitive.
 *
 * `children` is a such `createMemo` with additions.
 * It compares old and new values with widget-specifc algorithm, so it's able to handle element array.
 *
 * Unlike `children` in solid js, GSolid's `chilren` won't flat the array.
 *
 * @param fn
 * @returns
 */
export function children(fn: Accessor<any>): any {
    const c = createMemo(fn, undefined, { equals: widgetEquals });
    const memo = createMemo(() => resolveChildren(c()));
    (memo as AnyChildrenResult).toArray = () => {
        const c = memo();
        return Array.isArray(c) ? c : c != null ? [c] : [];
    };
    return memo as AnyChildrenResult;
}
