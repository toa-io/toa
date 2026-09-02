"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const epoch_js_1 = require("./epoch.js");
(0, node_test_1.it)('should be a sha256 hex', () => {
    strict_1.default.match((0, epoch_js_1.epoch)({ type: 'object' }), /^[a-f0-9]{64}$/);
});
(0, node_test_1.it)('should not depend on key order', () => {
    const a = { type: 'object', properties: { foo: { type: 'string', default: 'x' }, bar: { type: 'number' } } };
    const b = { properties: { bar: { type: 'number' }, foo: { default: 'x', type: 'string' } }, type: 'object' };
    strict_1.default.deepStrictEqual((0, epoch_js_1.epoch)(a), (0, epoch_js_1.epoch)(b));
});
(0, node_test_1.it)('should depend on values', () => {
    const a = { type: 'object', properties: { foo: { type: 'string' } } };
    const b = { type: 'object', properties: { foo: { type: 'number' } } };
    strict_1.default.notDeepStrictEqual((0, epoch_js_1.epoch)(a), (0, epoch_js_1.epoch)(b));
});
(0, node_test_1.it)('should keep array order', () => {
    const a = { enum: [1, 2] };
    const b = { enum: [2, 1] };
    strict_1.default.notDeepStrictEqual((0, epoch_js_1.epoch)(a), (0, epoch_js_1.epoch)(b));
});
//# sourceMappingURL=epoch.test.js.map