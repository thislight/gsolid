import { Accessor, JSX, createMemo } from "./index.js";
import { widgetEquals } from "./widget.jsx";

function resolveChildren(c: any): any {
    if (typeof c === "function" && !c.length) {
        return resolveChildren((c as Function)());
    }
    return c;
}

export type ResolvedJSXElement<A> = JSX.Element | A;
export type ResolvedChildren<A> =
    | ResolvedJSXElement<A>
    | ResolvedJSXElement<A>[];
export type ChildrenResult<A> = Accessor<ResolvedChildren<A>> & {
    toArray: () => ResolvedJSXElement<A>[];
};

export function children(
    fn: Accessor<JSX.Element | JSX.ArrayElement | undefined>
): ChildrenResult<never>;

export function children<A>(
    fn: Accessor<Accessor<A> | undefined>
): ChildrenResult<A | undefined>;

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
export function children<A>(
    fn: Accessor<JSX.Element | JSX.ArrayElement | Accessor<A> | undefined>
): ChildrenResult<JSX.Element | A> {
    const c = createMemo(fn, undefined, { equals: widgetEquals });
    const memo = createMemo(() => resolveChildren(c())) as ChildrenResult<A>;
    memo.toArray = () => {
        const c = memo();
        return Array.isArray(c) ? c : c != null ? [c] : [];
    };
    return memo;
}
