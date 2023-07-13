/**
 * SPDX: Apache-2.0
 */
import { createRenderer } from "solid-js/universal";
import Gtk from "gi://Gtk?version=4.0";
import GObject from "gi://GObject";
import type { Accessor, Component } from "./index.js";

export declare namespace JSX {
    type Element = Gtk.Widget;
    type ArrayElement = Element[];
    type ElementType = Element | ArrayElement | Component<any> | Accessor<Element>

    interface IntrinsicElements {}
}

function camelToKecab(str: string) {
    if (str !== str.toLowerCase()) {
        const newStr = str.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
        if (/^[A-Z]+/.test(str)) {
            return newStr.slice(1); // Remove the first '-' if the original is big camel
        } else {
            return newStr;
        }
    }
    return str;
}

export const {
    effect,
    memo,
    createComponent,
    createElement,
    createTextNode,
    insertNode,
    insert,
    spread,
    setProp,
    mergeProps,
} = createRenderer<Gtk.Widget>({
    createElement(name) {
        throw new TypeError(`could not create element for ${name}`);
    },
    createTextNode(value) {
        // FIXME: I don't known exactly if we need TextNode in gtk...
        // If we can avoid the case (since we don't need such thing in gtk),
        // throw an error is better than make a Label
        // Note: leave comment here if you understand this thing
        throw new TypeError(
            "working on a text node, this might be a bug since we don't need the thing in gtk"
        );
    },
    replaceText(textNode, value) {
        throw new TypeError(
            "working on a text node, this might be a bug since we don't need the thing in gtk"
        );
    },
    setProperty(node, name, value, prev) {
        if (name.startsWith("on")) {
            const originalName = name.slice(2);
            const convertedName = originalName.startsWith(":")
                ? originalName.slice(1) // support on:any-signal-name=___
                : camelToKecab(originalName);
            if (typeof value !== "function") {
                throw new TypeError("Signal recevier must be a function");
            }
            if (prev) {
                GObject.signal_handlers_disconnect_by_func(
                    node,
                    prev as (...rest: any[]) => any
                );
            }
            node.connect(convertedName, value as (...args: any[]) => any);
        } else {
            const convertedName = name.startsWith("prop:")
                ? name.slice(5) // support prop:AnyPropertyName=___
                : camelToKecab(name);
            node.set_property(convertedName, value);
        }
    },
    insertNode(parent, node, anchor) {
        node.insert_before(parent, anchor || null);
    },
    isTextNode(node) {
        return false;
    },
    removeNode(parent, node) {
        let child = parent.get_first_child();
        while (child) {
            if (child === node) {
                child.unparent();
                break;
            }
            child = child.get_next_sibling();
        }
    },
    getParentNode(node) {
        return node.get_parent() || undefined;
    },
    getFirstChild(node) {
        return node.get_first_child() || undefined;
    },
    getNextSibling(node) {
        return node.get_next_sibling() || undefined;
    },
});
