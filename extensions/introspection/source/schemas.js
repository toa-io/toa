"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.declaration = exports.annotation = void 0;
const node_path_1 = require("node:path");
const schemas_1 = __importDefault(require("@toa.io/schemas"));
const path = (0, node_path_1.resolve)(__dirname, '../schemas');
const namespace = schemas_1.default.namespace(path);
exports.annotation = namespace.schema('annotation');
exports.declaration = namespace.schema('declaration');
//# sourceMappingURL=schemas.js.map