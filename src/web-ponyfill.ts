/**
 * This module includes some API implementations, which is not exists in gjs, for solid js.
 * 
 * This module injects into solid js by a bundler, and is not intended to be used by user code.
 * 
 * @license Apache-2.0
 * @module
 */
import GLib from "gi://GLib";

export function queueMicrotask(fn: () => void) {
    GLib.timeout_add(GLib.PRIORITY_LOW, 0, () => {
        fn();
        return false;
    });
}
