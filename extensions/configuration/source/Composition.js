"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Composition = void 0;
exports.components = components;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const core_1 = require("@toa.io/core");
const const_js_1 = require("./const.js");
const UI_js_1 = require("./UI.js");
/** Hosts the values component in the service process. */
class Composition extends core_1.Connector {
    boot;
    constructor(boot) {
        super();
        this.boot = boot;
    }
    async open() {
        const composition = await this.boot.composition(components().paths);
        await composition.connect();
        this.depends(composition);
        // connected here rather than declared as a dependency: dependencies are connected
        // before `open` runs, so one added from inside it would never be
        const ui = new UI_js_1.UI(const_js_1.UI_PORT);
        await ui.connect();
        this.depends(ui);
    }
}
exports.Composition = Composition;
function components() {
    const labels = [];
    const paths = [];
    for (const entry of entries()) {
        labels.push(entry.name.replace('.', '-'));
        paths.push((0, node_path_1.resolve)(ROOT, entry.name));
    }
    return { labels, paths };
}
function entries() {
    const entries = (0, node_fs_1.readdirSync)(ROOT, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory());
}
const ROOT = (0, node_path_1.resolve)(__dirname, '../components/');
//# sourceMappingURL=Composition.js.map