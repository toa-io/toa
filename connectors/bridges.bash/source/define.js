"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.operations = operations;
exports.operation = operation;
const fs = __importStar(require("node:fs/promises"));
const node_path_1 = require("node:path");
const const_js_1 = require("./const.js");
async function operations(root) {
    const path = (0, node_path_1.join)(root, const_js_1.DIR);
    const names = await list(path);
    const promises = names
        .map(async (name) => operation(root, name));
    const operations = await Promise.all(promises);
    return operations.reduce((acc, operation, index) => {
        acc[names[index]] = operation;
        return acc;
    }, {});
}
async function operation(root, name) {
    const path = (0, node_path_1.join)(root, const_js_1.DIR, name + const_js_1.EXT);
    await fs.access(path, fs.constants.F_OK);
    return { type: 'computation' };
}
async function list(path) {
    const files = await fs.readdir(path);
    return files
        .filter((file) => (0, node_path_1.extname)(file) === const_js_1.EXT)
        .map((file) => file.slice(0, -const_js_1.EXT.length));
}
//# sourceMappingURL=define.js.map