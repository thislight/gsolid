import {
  Accessor,
  onCleanup,
  Owner,
  runWithOwner,
  untrack,
  createRenderEffect,
  getOwner,
} from "./index.js";
import Gio from "gi://Gio";
import GObject from "gi://GObject";

export interface Disconnectable {
  disconnect(id: number): void;
}

/**
 * Disconnect signals on cleanning up.
 * @param signals
 */
export function disconnectOnCleanup(signals: [Disconnectable, number][]) {
  onCleanup(() => {
    for (const [object, id] of signals) {
      object.disconnect(id);
    }
  });
  return (object: Disconnectable, id: number) => {
    signals.push([object, id]);
  };
}

const DEFAULT_DIFF_CHUNK_SIZE = 1000;

class GSolidArrayListModel<T extends GObject.Object> extends GObject.Object {
  static {
    GObject.registerClass(
      {
        Implements: [Gio.ListModel],
      },
      this,
    );
  }

  private reactiveOwner: Owner;
  private getValues: Accessor<T[]>;
  private type: GObject.GType<Object>;
  private snapshot: T[];
  private equals: (a: T, b: T) => boolean;

  declare items_changed: (
    position: number,
    nremoved: number,
    nadded: number,
  ) => void;
  declare get_item: (pos: number) => GObject.Object | null;
  declare get_n_items: () => number;
  declare get_item_type: () => GObject.GType<T>;

  constructor(
    reactiveOwner: Owner,
    type: GObject.GType<Object>,
    getValues: Accessor<T[]>,
    equals: (a: T, b: T) => boolean,
  ) {
    super();
    this.reactiveOwner = reactiveOwner;
    this.getValues = getValues;
    this.snapshot = untrack(getValues);
    this.type = type;
    this.equals = equals;
    this.initReactive();
  }

  private initReactive() {
    runWithOwner(this.reactiveOwner, () => {
      createRenderEffect(() => {
        const o = this.snapshot;
        this.snapshot = this.getValues();
        const signal = new Gio.Cancellable();
        onCleanup(() => signal.cancel());
        this.diffAndNotifyAsync(o, this.snapshot, signal);
      });
    });
  }

  private async diffAndNotifyAsync(
    oldItems: readonly T[],
    newItems: readonly T[],
    signal: Gio.Cancellable,
  ): Promise<void> {
    const m = oldItems.length;
    const n = newItems.length;

    if (m === 0 && n === 0) return;
    if (m === 0) {
      this.items_changed(0, 0, n);
      return;
    }
    if (n === 0) {
      this.items_changed(0, m, 0);
      return;
    }

    const maxD = m + n;
    const v: Int32Array = new Int32Array(2 * maxD + 1);
    const trace: Int32Array[] = [];

    // Myers Algorithm
    // - https://blog.jcoglan.com/2017/02/12/the-myers-diff-algorithm-part-1/
    // - https://blog.robertelder.org/diff-algorithm/
    let d = 0;
    let found = false;
    await new Promise<void>((resolve, reject) => {
      const step = () => {
        if (signal.is_cancelled()) {
          resolve();
          return;
        }
        try {
          while (d <= maxD) {
            trace.push(v.slice());
            for (let k = -d; k <= d; k += 2) {
              let x: number;
              if (k === -d || (k !== d && v[maxD + k - 1] < v[maxD + k + 1])) {
                x = v[maxD + k + 1];
              } else {
                x = v[maxD + k - 1] + 1;
              }
              let y = x - k;
              while (x < m && y < n && this.equals(oldItems[x], newItems[y])) {
                x++;
                y++;
              }
              v[maxD + k] = x;
              if (x >= m && y >= n) {
                found = true;
                d++;
                resolve();
                return;
              }
            }
            d++;
            if (d % DEFAULT_DIFF_CHUNK_SIZE === 0) {
              setTimeout(step, 0);
              return;
            }
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      step();
    });

    if (!found) return; // unreachable

    type Edit = "keep" | "add" | "remove";
    const edits: Edit[] = [];
    let x = m,
      y = n;
    for (let depth = d - 1; depth >= 0 && (x > 0 || y > 0); depth--) {
      const prevV = trace[depth];
      const k = x - y;
      const prevK =
        k === -depth ||
        (k !== depth && prevV[maxD + k - 1] < prevV[maxD + k + 1])
          ? k + 1
          : k - 1;
      const prevX = prevV[maxD + prevK];
      const prevY = prevX - prevK;

      while (x > prevX && y > prevY) {
        edits.unshift("keep");
        x--;
        y--;
      }

      if (x === prevX) {
        edits.unshift("add");
        y--;
      } else {
        edits.unshift("remove");
        x--;
      }

      if (depth % DEFAULT_DIFF_CHUNK_SIZE === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (signal.is_cancelled()) {
          return;
        }
      }
    }

    let position = 0;
    let nRemoved = 0;
    let nAdded = 0;

    for (const edit of edits) {
      if (edit === "keep") {
        if (nRemoved > 0 || nAdded > 0) {
          this.items_changed(position, nRemoved, nAdded);
          position += nAdded;
          nRemoved = nAdded = 0;
        }
        position++;
      } else if (edit === "remove") {
        nRemoved++;
      } else {
        nAdded++;
      }
    }
    if (nRemoved > 0 || nAdded > 0) {
      this.items_changed(position, nRemoved, nAdded);
    }
  }

  vfunc_get_n_items(): number {
    return this.snapshot.length;
  }

  vfunc_get_item(position: number): T | null {
    return this.snapshot[position] || null;
  }

  vfunc_get_item_type() {
    return this.type;
  }
}

function strictEq<T>(a: T, b: T) {
  return a === b;
}

/**
 * Create a {@link Gio.ListModel} by monitoring the `values`.
 * The values' `type` must be a vaild {@link GObject.Object}.
 *
 * This model does not monitor the properties of the elements.
 * It is only triggered as the `value` itself changed.
 *
 * The algorithm is optimized so it has okay performance for arrays with any size.
 * Still not recommeded for large arrays.
 *
 * @example the intented usage
 * ```tsx
 * class User extends GObject.Object {
 *   static { GObject.registerClass({}, this); }
 * }
 * const [users] = createResource(listUsers, {initial: []});
 *
 * const usersModel = createArrayListModel(User, users, User.equals)
 *
 * <ListView model={usersModel} {...props} />
 * ```
 *
 * @param type
 * @param values
 * @param equals
 * @returns
 */
export function createArrayListModel<T extends GObject.Object>(
  type: { readonly $gtype: GObject.GType<Object> },
  values: Accessor<T[]>,
  equals: (a: T, b: T) => boolean = strictEq,
): Gio.ListModel {
  const model = new GSolidArrayListModel(
    getOwner()!,
    type.$gtype,
    values,
    equals,
  );
  return model;
}
