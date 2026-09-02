"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const manifest_js_1 = require("./manifest.js");
(0, node_test_1.it)('should validate', async () => {
    const additional = { schema: {}, foo: 'bar' };
    strict_1.default.throws(() => {
        (0, manifest_js_1.manifest)(additional);
    }, (error) => /not expected/.test(error.message));
    const wrongType = { schema: 'not ok' };
    strict_1.default.throws(() => {
        (0, manifest_js_1.manifest)(wrongType);
    }, (error) => /object/.test(error.message));
});
//# sourceMappingURL=manifest.test.js.map