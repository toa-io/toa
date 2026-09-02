"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_util_1 = require("node:util");
const Secret_js_1 = require("./Secret.js");
const secret = new Secret_js_1.Secret('s3cret');
(0, node_test_1.it)('should unwrap', () => {
    strict_1.default.deepStrictEqual(secret.unwrap(), 's3cret');
});
(0, node_test_1.it)('should not show as a string', () => {
    strict_1.default.deepStrictEqual(String(secret), Secret_js_1.REDACTED);
    strict_1.default.deepStrictEqual(`${secret}`, Secret_js_1.REDACTED);
    strict_1.default.deepStrictEqual('' + secret, Secret_js_1.REDACTED);
});
(0, node_test_1.it)('should not show in JSON', () => {
    strict_1.default.deepStrictEqual(JSON.stringify({ key: secret }), '{"key":"<REDACTED>"}');
});
(0, node_test_1.it)('should not show when inspected', () => {
    strict_1.default.deepStrictEqual((0, node_util_1.inspect)(secret), Secret_js_1.REDACTED);
    strict_1.default.ok((0, node_util_1.inspect)({ key: secret }).includes(Secret_js_1.REDACTED));
    strict_1.default.ok(!((0, node_util_1.inspect)({ key: secret }).includes('s3cret')));
});
(0, node_test_1.it)('should not expose the value as a property', () => {
    strict_1.default.deepStrictEqual(Object.keys(secret), []);
    strict_1.default.deepStrictEqual({ ...secret }, {});
});
//# sourceMappingURL=Secret.test.js.map