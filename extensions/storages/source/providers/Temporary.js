"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Temporary = void 0;
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const FileSystem_js_1 = require("./FileSystem.js");
class Temporary extends FileSystem_js_1.FileSystem {
    constructor(options) {
        const path = (0, node_path_1.join)((0, node_os_1.tmpdir)(), options.directory);
        super({ path });
    }
}
exports.Temporary = Temporary;
//# sourceMappingURL=Temporary.js.map