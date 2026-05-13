import { onCleanup } from "./index.js";

export interface Disconnectable {
    disconnect(id: number): void
}

/**
 * Disconnect signals on cleanning up.
 * @param signals
 */
export function disconnectOnCleanup(signals: [Disconnectable, number][]) {
    onCleanup(() => {
        for (const [object, id] of signals) {
            object.disconnect(id)
        }
    })
    return (object: Disconnectable, id: number) => {
        signals.push([object, id])
    }
}
