"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.epoch = epoch;
const node_crypto_1 = require("node:crypto");
/** The same for the same schema, whatever the key order it was written in. */
function epoch(schema) {
    return (0, node_crypto_1.createHash)('sha256').update(canonical(schema)).digest('hex');
}
function canonical(value) {
    if (Array.isArray(value))
        return '[' + value.map(canonical).join(',') + ']';
    if (value !== null && typeof value === 'object') {
        const object = value;
        const keys = Object.keys(object).filter((key) => object[key] !== undefined).sort();
        const entries = keys.map((key) => JSON.stringify(key) + ':' + canonical(object[key]));
        return '{' + entries.join(',') + '}';
    }
    return JSON.stringify(value) ?? 'null';
}
//# sourceMappingURL=epoch.js.map