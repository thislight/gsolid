/**
 * SPDX: Apache-2.0
 */
import type { JSX } from "./jsx-runtime.js";
export type { JSX } from "./jsx-runtime.js";
export { spread as spreadProps } from "./jsx-runtime.js";

// Forward Solid functions
export {
    ErrorBoundary,
    createSignal,
    createEffect,
    createMemo,
    createComputed,
    createReaction,
    createRenderEffect,
    createResource,
    createDeferred,
    createUniqueId,
    catchError,
    onMount,
    onCleanup,
    untrack,
    splitProps,
    startTransition,
    useTransition,
    observable,
    from,
    mapArray,
    indexArray,
    lazy,
    createSelector,
    batch,
    on,
    createRoot,
    getOwner,
    runWithOwner,
    mergeProps,
} from "solid-js";

export { children, start, createContext, useContext } from "./reactive.js";

export type { Accessor, AccessorArray, Setter, Owner } from "solid-js";

/**
 * General component type without implicit `children` prop.
 */
export type Component<P = {}> = (props: P) => JSX.Element;

/**
 * Extend props to forbid the `children` prop. Prevent passing `children` by chance.
 */
export type VoidProps<P = {}> = P & {
    children?: never;
};

/**
 * Component type forbids `children` prop.
 */
export type VoidComponent<P = {}> = Component<VoidProps<P>>;

/**
 * Extend props to allow optional `children` prop with {@link JSX.Element}.
 */
export type ParentProps<P = {}> = P & {
    children?: JSX.Element;
};

/**
 * Component type allows optional `children` prop with {@link JSX.Element}.
 */
export type ParentComponent<P = {}> = Component<ParentProps<P>>;

/**
 * Extend props to require `children` prop with specific type `C`.
 */
export type FlowProps<P = {}, C = JSX.Element> = P & {
    children: C;
};

/**
 * Component type requires specific type for `children` prop.
 */
export type FlowComponent<P = {}, C = JSX.Element> = Component<FlowProps<P, C>>;

export type ValidComponent = keyof JSX.IntrinsicElements | Component<any>;

/**
 * Props type of component type.
 */
export type ComponentProps<T extends ValidComponent> = T extends Component<
    infer P
>
    ? P
    : T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T]
    : Record<string, unknown>;

/**
 * Types of `props.ref`
 */
export type Ref<T> = T | ((val: T) => void);
