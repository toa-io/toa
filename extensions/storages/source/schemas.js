"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = exports.tmp = exports.fs = exports.cloudinary = exports.spaces = exports.s3 = exports.annotation = void 0;
const node_path_1 = require("node:path");
const schemas_1 = require("@toa.io/schemas");
const path = (0, node_path_1.resolve)(__dirname, '../schemas');
const ns = (0, schemas_1.namespace)(path);
exports.annotation = ns.schema('annotation');
exports.s3 = ns.schema('s3');
exports.spaces = ns.schema('spaces');
exports.cloudinary = ns.schema('cloudinary');
exports.fs = ns.schema('fs');
exports.tmp = ns.schema('tmp');
exports.test = ns.schema('test');
//# sourceMappingURL=schemas.js.map