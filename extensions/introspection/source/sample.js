"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capture = capture;
exports.samplable = samplable;
const node_stream_1 = require("node:stream");
const const_js_1 = require("./const.js");
/**
 * Captures the payload of a call. Only reached when both the context and the
 * component have opted in, and never for a denied namespace.
 */
function capture(input, outcome) {
    return { at: Date.now(), input: redact(input), outcome };
}
function samplable(input) {
    return !(input instanceof node_stream_1.Readable);
}
function redact(value) {
    if (value === null || value === undefined || typeof value !== 'object')
        return truncate(value);
    if (Array.isArray(value))
        return truncate(value.map(redact));
    const result = {};
    for (const [key, property] of Object.entries(value))
        result[key] = const_js_1.REDACTED.test(key) ? '***' : redact(property);
    return truncate(result);
}
/**
 * The map holds one sample per edge indefinitely, so a single oversized
 * payload must not become a permanent tenant of the collection.
 */
function truncate(value) {
    let serialized;
    try {
        serialized = JSON.stringify(value) ?? '';
    }
    catch {
        return '[unserializable]';
    }
    if (serialized.length <= const_js_1.SAMPLE_LIMIT)
        return value;
    return '[truncated]';
}
//# sourceMappingURL=sample.js.map