"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const negotiate_js_1 = require("./negotiate.js");
(0, node_test_1.it)('should return acceptable', async () => {
    const accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp';
    const available = ['application/xml', 'text/html'];
    const result = (0, negotiate_js_1.negotiate)(accept, available);
    strict_1.default.strictEqual(result, 'text/html');
});
(0, node_test_1.it)('should return null if not acceptable', async () => {
    const accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp';
    const available = ['application/json'];
    const result = (0, negotiate_js_1.negotiate)(accept, available);
    strict_1.default.strictEqual(result, null);
});
//# sourceMappingURL=negotiate.test.js.map