import GObject from "gi://GObject?version=2.0";
import { onCleanup } from "./index.js";

export function registeredGClass<
    T extends typeof GObject.Object,
    Props extends { [key: string]: GObject.ParamSpec },
    Interfaces extends { $gtype: GObject.GType }[],
    Sigs extends {
        [key: string]: {
            param_types?: readonly GObject.GType[];
            [key: string]: any;
        };
    }
>(metadata: GObject.MetaInfo<Props, Interfaces, Sigs>) {
    return (originalClass: T) => {
        return /* @__PURE__ */ GObject.registerClass(metadata, originalClass);
    };
}

/**
 * Disconnect signals on cleanning up.
 * @param signals 
 */
export function disconnectOnCleanup(signals: [GObject.Object, number][]) {
    onCleanup(() => {
        for (const [object, id] of signals) {
            object.disconnect(id)
        }
    })
    return (object: GObject.Object, id: number) => {
        signals.push([object, id])
    }
}
