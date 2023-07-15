/**
 * This module contains reimplementation of solid-js reactive primitives.
 *
 * Code may copied from solid-js under the MIT License.
 *
 * MIT License
 * Copyright (c) 2016-2023 Ryan Carniato
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {
    Accessor,
    FlowComponent,
    FlowProps,
    JSX,
    Owner,
    createMemo,
    createRenderEffect,
    createRoot,
    getOwner,
    untrack,
} from "./index.js";
import { widgetEquals } from "./widget.jsx";

function lookup(owner: Owner | null, key: symbol | string): any {
    return owner
        ? owner.context && owner.context[key] !== undefined
            ? owner.context[key]
            : lookup(owner.owner, key)
        : undefined;
}

function resolveChildren(c: any): any {
    if (typeof c === "function" && !c.length) {
        return resolveChildren((c as Function)());
    }
    return c;
}

export type ResolvableJSXElement = JSX.Element | JSX.Element[] | undefined;
export type ResolvedChildren<T extends ResolvableJSXElement> = T;
export type ChildrenResult<T extends ResolvableJSXElement> = Accessor<
    ResolvedChildren<T>
> & {
    toArray: () => JSX.Element[];
};
export type ChildrenAccessorResult<T, A extends T[] = T[]> = Accessor<T> & {
    toArray: () => A;
};

type AnyChildrenResult = Accessor<any> & { toArray: () => any };

export function children<T extends ResolvableJSXElement>(
    fn: Accessor<T>
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

/**
 * Start your `code`. You can use JSX and reactive permitive in `code` before the returned `disposer` called.
 *
 * ````jsx
 * const dispose = start(() => {
 *  <ReactiveWindow open={true} onCloseRequest={() => {
 *      dispose();
 *      loop.quit();
 *      return true;
 *  }}>
 *      <Label label="Hello World" />
 *  </ReactiveWindow>
 * })
 *
 * loop.run()
 * ````
 * @param code
 * @returns the dispose function
 */
export function start(code: () => void) {
    let disposer: () => void;
    createRoot((d) => {
        disposer = d;
        code();
    });
    return disposer!;
}

interface EffectOptions {
    name?: string;
}

function createProvider(id: symbol, options?: EffectOptions) {
    return function provider(
        props: FlowProps<{ value: unknown }, JSX.Element | undefined>
    ) {
        let res: ChildrenResult<JSX.Element | undefined>;
        createRenderEffect(
            () =>
                (res = untrack(() => {
                    const Owner = getOwner();
                    Owner!.context = { [id]: props.value };
                    return children(() => props.children);
                })),
            undefined,
            options
        );
        return res! as unknown as JSX.Element;
    };
}

export type ContextProviderComponent<T> = FlowComponent<
    { value: T },
    JSX.Element | undefined
>;

// Context API
export interface Context<T> {
    id: symbol;
    Provider: ContextProviderComponent<T>;
    defaultValue: T;
}

/**
 * Creates a Context to handle a state scoped for the children of a component
 * ```typescript
 * interface Context<T> {
 *   id: symbol;
 *   Provider: FlowComponent<{ value: T }>;
 *   defaultValue: T;
 * }
 * export function createContext<T>(
 *   defaultValue?: T,
 *   options?: { name?: string }
 * ): Context<T | undefined>;
 * ```
 * @param defaultValue optional default to inject into context
 * @param options allows to set a name in dev mode for debugging purposes
 * @returns The context that contains the Provider Component and that can be used with `useContext`
 */
export function createContext<T>(
    defaultValue?: undefined,
    options?: EffectOptions
): Context<T | undefined>;
export function createContext<T>(
    defaultValue: T,
    options?: EffectOptions
): Context<T>;
export function createContext<T>(
    defaultValue?: T,
    options?: EffectOptions
): Context<T | undefined> {
    const id = Symbol("context");
    return { id, Provider: createProvider(id, options), defaultValue };
}

/**
 * use a context to receive a scoped state from a parent's Context.Provider
 *
 * @param context Context object made by `createContext`
 * @returns the current or `defaultValue`, if present
 *
 * @description https://www.solidjs.com/docs/latest/api#usecontext
 */
export function useContext<T>(context: Context<T>): T {
    let ctx;
    return (ctx = lookup(getOwner(), context.id)) !== undefined
        ? ctx
        : context.defaultValue;
}
