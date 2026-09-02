"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttle = exports.output = exports.input = exports.message = void 0;
const node_path_1 = require("node:path");
const schemas_1 = __importDefault(require("@toa.io/schemas"));
const path = (0, node_path_1.resolve)(__dirname, '../../../schemas/io');
const namespace = schemas_1.default.namespace(path);
exports.message = namespace.schema('message');
exports.input = namespace.schema('input');
exports.output = namespace.schema('output');
exports.throttle = namespace.schema('throttle');
//# sourceMappingURL=schemas.js.map