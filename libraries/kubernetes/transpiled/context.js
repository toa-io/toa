"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.set = exports.get = void 0;
const command_1 = require("@toa.io/command");
async function get() {
    const { stdout } = await (0, command_1.$) `kubectx -c`;
    return stdout;
}
exports.get = get;
async function set(name) {
    await (0, command_1.$) `kubectx ${name}`;
}
exports.set = set;
//# sourceMappingURL=context.js.map