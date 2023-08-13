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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalize = void 0;
const node_path_1 = require("node:path");
const schemas = __importStar(require("@toa.io/schemas"));
const generic_1 = require("@toa.io/generic");
function normalize(declaration) {
    const map = {};
    if (declaration === undefined)
        return map;
    if (typeof declaration === 'string' || Array.isArray(declaration))
        declaration = { '.': declaration };
    for (const [key, value] of Object.entries(declaration))
        if (typeof value === 'string')
            map[key] = format([value]);
        else
            map[key] = format(value);
    validate(map);
    return map;
}
exports.normalize = normalize;
function format(values) {
    return values.map(generic_1.shards).flat();
}
function validate(map) {
    schema.validate(map);
    for (const uris of Object.values(map))
        for (const uri of uris)
            checkCredentials(uri);
}
function checkCredentials(uri) {
    const url = new URL(uri);
    if (url.username !== '' || url.password !== '')
        throw new Error(`Pointer URI '${uri}' must not contain credentials. ` +
            'Please refer to the "Credentials" section in the documentation for more information.');
}
const path = (0, node_path_1.resolve)(__dirname, '../schemas/urimap.cos.yaml');
const schema = schemas.schema(path);
//# sourceMappingURL=annotation.js.map