"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Composition = void 0;
exports.find = find;
exports.components = components;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const core_1 = require("@toa.io/core");
class Composition extends core_1.Connector {
    boot;
    constructor(boot) {
        super();
        this.boot = boot;
    }
    async open() {
        const paths = find();
        const composition = await this.boot.composition(paths);
        await composition.connect();
        this.depends(composition);
    }
}
exports.Composition = Composition;
function find() {
    return entries().map((entry) => (0, node_path_1.resolve)(ROOT, entry.name));
}
function entries() {
    const entries = (0, node_fs_1.readdirSync)(ROOT, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory());
}
function components() {
    const labels = [];
    const paths = [];
    for (const entry of entries()) {
        labels.push(entry.name.replace('.', '-'));
        paths.push((0, node_path_1.resolve)(ROOT, entry.name));
    }
    return { labels, paths };
}
const ROOT = (0, node_path_1.resolve)(__dirname, '../components/');
//# sourceMappingURL=Composition.js.map