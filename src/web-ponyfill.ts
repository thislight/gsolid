/**
 * This module includes some API implementations, which is not exists in gjs, for solid js.
 *
 * This module injects into solid js by a bundler, and is not intended to be used by user code.
 *
 * @license Apache-2.0
 * @module
 */
import GLib from "gi://GLib";

const microtaskBatch: (() => void)[] = [];
let microtaskScheduleId: number | undefined = undefined;

function runMicrotasks() {
  try {
    let nextMicrotask;
    while ((nextMicrotask = microtaskBatch.shift())) {
      nextMicrotask();
    }
  } finally {
    microtaskScheduleId = undefined;
  }
  return false;
}

export function queueMicrotask(fn: () => void) {
  microtaskBatch.push(fn);
  if (!microtaskScheduleId) {
    microtaskScheduleId = GLib.idle_add(
      GLib.PRIORITY_DEFAULT_IDLE,
      runMicrotasks,
    );
  }
}
