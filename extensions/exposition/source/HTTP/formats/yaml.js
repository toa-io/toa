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
exports.multipart = exports.type = void 0;
exports.decode = decode;
exports.encode = encode;
const yaml = __importStar(require("js-yaml"));
exports.type = 'application/yaml';
exports.multipart = 'multipart/yaml';
function decode(buffer, charset = 'utf-8') {
    const text = buffer.toString(charset);
    return yaml.load(text);
}
function encode(value) {
    const serializable = value instanceof Error ? Object.assign({}, value) : represent(value);
    const text = yaml.dump(serializable, { lineWidth: -1, noRefs: true });
    return Buffer.from(text);
}
/** What says how it is to be written — a redacted secret — is written that way, as in JSON. */
function represent(value) {
    if (typeof value !== 'object' || value === null || value instanceof Date || Buffer.isBuffer(value))
        return value;
    if ('toJSON' in value && typeof value.toJSON === 'function')
        return value.toJSON();
    if (Array.isArray(value))
        return value.map(represent);
    const object = value;
    const represented = {};
    for (const key of Object.keys(object))
        represented[key] = represent(object[key]);
    return represented;
}
//# sourceMappingURL=yaml.js.map