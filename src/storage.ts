import GObject from "gi://GObject?version=2.0";
import { registeredGClass } from "./gobject";

interface StorageEventMap {
    storage: (event: StorageEvent) => void;
}

interface StorageEvent {
    readonly key: string | null;
    readonly newValue: string | null;
    readonly oldValue: string | null;
    readonly storageArea: Storage;
}

export interface Storage {
    readonly length: number;
    key(idx: number): string | null;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;

    connect<K extends keyof StorageEventMap>(
        name: K,
        callback: StorageEventMap[K]
    ): number;
    disconnect(id: number): void;
}

const StorageEvent = /* @__PURE__ */ GObject.registerClass(
    class StorageEvent extends GObject.Object implements StorageEvent {
        key: string | null;
        newValue: string | null;
        oldValue: string | null;
        storageArea: Storage;

        constructor(
            key: string | null,
            nval: string | null,
            oval: string | null,
            area: Storage
        ) {
            super();
            this.key = key;
            this.newValue = nval;
            this.oldValue = oval;
            this.storageArea = area;
        }
    }
);

@registeredGClass({
    Signals: {
        storage: {
            param_types: [StorageEvent.$gtype],
            return_value: GObject.TYPE_NONE,
        },
    },
})
export class SessionStorage extends GObject.Object implements Storage {
    dict: Map<string, string>;
    allKeys: string[];

    constructor() {
        super();
        this.dict = new Map();
        this.allKeys = [];
    }

    key(idx: number): string | null {
        if (Math.floor(idx) == idx && idx >= 0 && idx < this.length) {
            return this.allKeys[idx];
        } else {
            return null;
        }
    }

    getItem(key: string): string | null {
        return this.dict.get(key) ?? null;
    }

    setItem(key: string, value: string): void {
        const oval = this.getItem(key);
        this.dict.set(key, value);
        if (!this.allKeys.includes(key)) {
            this.allKeys.push(key);
        }
        this.emitStorageEvent(key, value, oval);
    }

    removeItem(key: string): void {
        const oval = this.getItem(key);
        this.dict.delete(key);
        const idx = this.allKeys.indexOf(key);
        this.allKeys.splice(idx, 1);
        this.emitStorageEvent(key, null, oval);
    }

    clear(): void {
        this.dict.clear();
        this.allKeys.splice(0, this.allKeys.length);
        this.emitStorageEvent(null, null, null);
    }

    get length() {
        return this.dict.size;
    }

    emitStorageEvent(
        k: string | null,
        nval: string | null,
        oval: string | null
    ) {
        this.emit("storage", new StorageEvent(k, nval, oval, this));
    }
}
