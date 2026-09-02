"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflow = exports.remove = exports.get = exports.put = void 0;
const node_path_1 = require("node:path");
const schemas_1 = __importDefault(require("@toa.io/schemas"));
const path = (0, node_path_1.resolve)(__dirname, '../../../schemas/octets');
const namespace = schemas_1.default.namespace(path);
exports.put = namespace.schema('put');
exports.get = namespace.schema('get');
exports.remove = namespace.schema('delete');
exports.workflow = namespace.schema('workflow');
//# sourceMappingURL=schemas.js.map