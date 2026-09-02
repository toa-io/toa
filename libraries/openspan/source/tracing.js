"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
exports.current = current;
exports.sampling = sampling;
exports.decide = decide;
exports.create = create;
exports.decode = decode;
exports.encode = encode;
const node_crypto_1 = require("node:crypto");
const state_js_1 = require("./state.js");
const exporters_js_1 = require("./exporters.js");
function run(context, fn) {
    return state_js_1.state.storage.run(context, fn);
}
function current() {
    return state_js_1.state.storage.getStore();
}
/**
 * Configures head-based sampling. Replaces the current configuration entirely.
 *
 * `sample` is the probability (0..1) of recording a trace, defaults to 1.
 * `rate` is the maximum number of recorded traces per second per process
 * (may be fractional: 0.5 is one trace per 2 seconds), unlimited when omitted.
 */
function sampling(options = {}) {
    state_js_1.state.sample = options.sample ?? 1;
    state_js_1.state.bucket = options.rate === undefined ? null : new Bucket(options.rate);
}
/**
 * Makes the sampling decision for a trace root.
 */
function decide() {
    // a span nothing consumes is not worth creating
    if (!(0, exporters_js_1.recording)())
        return false;
    if (state_js_1.state.sample !== 1 && Math.random() >= state_js_1.state.sample)
        return false;
    return state_js_1.state.bucket?.take() ?? true;
}
function create(parent) {
    const context = {
        traceId: parent?.traceId ?? id(TRACE_ID),
        spanId: id(SPAN_ID),
        sampled: parent?.sampled ?? decide()
    };
    if (parent?.spanId !== undefined)
        context.parentId = parent.spanId;
    if (parent?.service !== undefined)
        context.service = parent.service;
    return context;
}
// https://www.w3.org/TR/trace-context/#traceparent-header
function decode(traceparent) {
    const match = EXPRESSION.exec(traceparent);
    if (match === null)
        return null;
    const [, traceId, spanId, flags] = match;
    if (traceId === ZERO_TRACE || spanId === ZERO_SPAN)
        return null;
    return {
        traceId,
        spanId,
        sampled: (Number.parseInt(flags, 16) & SAMPLED) === SAMPLED
    };
}
function encode(context) {
    return `00-${context.traceId}-${context.spanId ?? ZERO_SPAN}-${context.sampled ? '01' : '00'}`;
}
/**
 * Identifiers are drawn from a pre-filled buffer: a `randomBytes` call per span costs
 * an order of magnitude more than the rest of opening one, and a span is opened on
 * every call. Same source of randomness, refilled a few hundred identifiers at a time.
 */
function id(bytes) {
    if (offset + bytes > POOL.length) {
        (0, node_crypto_1.randomFillSync)(POOL);
        offset = 0;
    }
    const value = POOL.toString('hex', offset, offset + bytes);
    offset += bytes;
    return value;
}
const TRACE_ID = 16;
const SPAN_ID = 8;
const POOL = Buffer.allocUnsafe(4096);
let offset = POOL.length; // forces a fill on the first draw
class Bucket {
    rate;
    capacity;
    tokens;
    updated = Date.now();
    constructor(rate) {
        this.rate = rate;
        this.capacity = Math.max(rate, 1);
        this.tokens = this.capacity;
    }
    take() {
        const now = Date.now();
        this.tokens = Math.min(this.capacity, this.tokens + ((now - this.updated) / 1000) * this.rate);
        this.updated = now;
        if (this.tokens < 1)
            return false;
        this.tokens--;
        return true;
    }
}
const EXPRESSION = /^00-([\da-f]{32})-([\da-f]{16})-([\da-f]{2})$/;
const ZERO_TRACE = '0'.repeat(32);
const ZERO_SPAN = '0'.repeat(16);
const SAMPLED = 0x01;
//# sourceMappingURL=tracing.js.map