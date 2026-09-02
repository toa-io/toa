"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = get;
exports.set = set;
const node_util_1 = require("node:util");
const node_child_process_1 = require("node:child_process");
const exec = (0, node_util_1.promisify)(node_child_process_1.exec);
async function get() {
    const { stdout } = await exec('kubectx -c');
    return stdout;
}
async function set(name) {
    await exec(`kubectx ${name}`);
}
//# sourceMappingURL=context.js.map