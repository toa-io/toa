"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Factory = void 0;
const node_path_1 = require("node:path");
const Algorithm_js_1 = require("./Algorithm.js");
const const_js_1 = require("./const.js");
class Factory {
    algorithm(root, name) {
        const path = (0, node_path_1.join)(root, const_js_1.DIR, name + const_js_1.EXT);
        return new Algorithm_js_1.Algorithm(path);
    }
}
exports.Factory = Factory;
//# sourceMappingURL=Factory.js.map