/**
 * Package.ts, modified package.js from gjs.
 * 
 * This new one aims to replace it to keep the goal of package.js.
 * - It's a protocol and a helper
 * - Freedom to initialise
 * - Simple & Stupid
 * - Much less side effect (0 global variables)
 *
 * Since there is so much change, undoubtfully it is incompatiable to package.js.
 *
 * ## How to use it
 * Use {@link set} to set the app tree, and use functions under this module.
 *
 * @license Apache-2.0
 * @module
 */

// Original Copyright Statement:
// SPDX-FileCopyrightText: 2012 Giovanni Campagna
// SPDX-License-Identifier: MIT OR LGPL-2.0-or-later

import GLib from "gi://GLib";
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import System from "system";
import Gettext from "gettext";
import GIRepository from "gi://GIRepository?version=2.0";

// public
export let name: string;
export let version: string;
export let prefix: string;
export let datadir: string;
export let libdir: string;
export let pkgdatadir: string;
export let pkglibdir: string;
export let moduledir: string;
export let localedir: string;

// private
let _pkgname: string;

function _findEffectiveEntryPointName() {
    let entryPoint = System.programInvocationName;
    while (GLib.file_test(entryPoint, GLib.FileTest.IS_SYMLINK))
        entryPoint = GLib.file_read_link(entryPoint);

    return GLib.path_get_basename(entryPoint);
}

export type AppTree = {
    name: string;
    version: string;
    prefix: string;
    libdir: string;
    datadir?: string;
    pkglibdir?: string;
    pkgdatadir?: string;
    localedir?: string;
    moduledir?: string;
};

/**
 * Acknowledge app the environment.
 * The application needs some runtime information for additonal features from platforms.
 * This function can only be called once.
 *
 * ## Out-of-tree running
 * Unlike package.js, package.ts is so stupid to understand your project structure.
 * So package.ts is without out-of-tree running built-in.
 *
 * But package.ts is more flexible to your package structure, you can configure most of
 * the paths in this process.
 * 
 * ## External resources
 * This function does not load any GResource automatically. Use {@link requireResource} to load them.
 * 
 * @param tree
 */
export function set(tree: Readonly<AppTree>) {
    if (_pkgname) {
        throw new Error(`package is already set to "${_pkgname}"`)
    }
    _pkgname = tree.name;
    name = _findEffectiveEntryPointName();

    GLib.set_application_name(name);

    prefix = tree.prefix;
    libdir = tree.libdir;
    datadir = tree.datadir ?? GLib.build_filenamev([prefix, "share"]);

    pkglibdir = tree.pkgdatadir ?? GLib.build_filenamev([libdir, _pkgname]);
    const girpath = GLib.build_filenamev([pkglibdir, "girepository-1.0"]);
    pkgdatadir = tree.pkgdatadir ?? GLib.build_filenamev([datadir, _pkgname]);
    localedir = tree.localedir ?? GLib.build_filenamev([datadir, "locale"]);

    moduledir = tree.moduledir ?? pkgdatadir;

    imports.searchPath.unshift(moduledir);
    GIRepository.Repository.prepend_search_path(girpath);
    GIRepository.Repository.prepend_library_path(pkglibdir);
}

/**
 * Mark a dependency on a specific version of one or more
 * external GI typelibs.
 * `libs` must be an object whose keys are a typelib name,
 * and values are the respective version. The empty string
 * indicates any version.
 *
 * @param libs the external dependencies to import
 */
export function require(libs: Record<string, string>) {
    for (let l in libs) requireSymbol(l, libs[l]);
}

/**
 * As checkSymbol(), but exit with an error if the
 * dependency cannot be satisfied.
 *
 * @param lib an external dependency to import
 * @param [ver] version of the dependency
 * @param [symbol] symbol to check for
 */
export function requireSymbol(lib: string, ver: string, symbol?: string) {
    if (!checkSymbol(lib, ver, symbol)) {
        if (symbol) printerr(`Unsatisfied dependency: No ${symbol} in ${lib}`);
        else printerr(`Unsatisfied dependency: ${lib}`);
        System.exit(1);
    }
}

interface ObjectClass {
    find_property(property_name: string): GObject.ParamSpec | null;
}

/**
 * Check whether an external GI typelib can be imported
 * and provides @symbol.
 *
 * Symbols may refer to
 *  - global functions         ('main_quit')
 *  - classes                  ('Window')
 *  - class / instance methods ('IconTheme.get_default' / 'IconTheme.has_icon')
 *  - GObject properties       ('Window.default_height')
 *
 * @param lib an external dependency to import
 * @param [ver] version of the dependency
 * @param [symbol] symbol to check for
 * @returns true if `lib` can be imported and provides `symbol`, false
 * otherwise
 */
function checkSymbol(lib: string, ver?: string, symbol?: string): boolean {
    let Lib = null;

    if (ver) imports.gi.versions[lib] = ver;

    try {
        Lib = (imports.gi as Record<string, any>)[lib];
    } catch (e) {
        return false;
    }

    if (!symbol) return true; // Done

    let [klass, sym] = symbol.split(".");
    if (klass === symbol) return typeof Lib[symbol] !== "undefined";

    let obj = Lib[klass];
    if (typeof obj === "undefined") return false;

    if (
        typeof obj[sym] !== "undefined" ||
        (obj.prototype && typeof obj.prototype[sym] !== "undefined")
    )
        return true; // class- or object method

    // GObject property
    let pspec = null;
    if (GObject.type_is_a(obj.$gtype, GObject.TYPE_INTERFACE)) {
        let iface = GObject.type_default_interface_ref(obj.$gtype);
        pspec = GObject.Object.interface_find_property(iface, sym);
    } else if (GObject.type_is_a(obj.$gtype, GObject.TYPE_OBJECT)) {
        pspec = (GObject.Object as unknown as ObjectClass).find_property.call(
            obj.$gtype,
            sym
        );
    }

    return pspec !== null;
}

export function initGettext() {
    Gettext.bindtextdomain(_pkgname, localedir);
    Gettext.textdomain(_pkgname);
}

/**
 * Load resources under `pkgdatadir` into global resource table.
 *
 * This function correctly unregister resource and throw the error if is in error.
 */
export function requireResource(names: string[]) {
    const loadedResources = []
    try{
        for (const name of names) {
            const resource = Gio.Resource.load(GLib.build_filenamev([pkgdatadir, name]))
            Gio.resources_register(resource)
            loadedResources.push(resource)
        }
    } catch (e) {
        for(const res of loadedResources) {
            Gio.resources_unregister(res)
        }
        throw e
    }
}
