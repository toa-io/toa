"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const now_js_1 = require("./now.js");
const time = new Date().getTime();
(0, node_test_1.it)('should return current ms', () => {
    const ms = Number.parseInt((0, now_js_1.now)(undefined));
    strict_1.default.ok(ms >= time);
});
(0, node_test_1.it)('should add shift', () => {
    const ms = Number.parseInt((0, now_js_1.now)(undefined, '1000'));
    strict_1.default.ok(ms >= time + 1000);
});
(0, node_test_1.it)('should parse +', () => {
    const ms = Number.parseInt((0, now_js_1.now)(undefined, '+1000'));
    strict_1.default.ok(ms >= time + 1000);
});
(0, node_test_1.it)('should parse seconds', () => {
    const ms = Number.parseInt((0, now_js_1.now)(undefined, '1s'));
    strict_1.default.ok(ms >= time + 1000);
});
(0, node_test_1.it)('should parse hours', () => {
    const ms = Number.parseInt((0, now_js_1.now)(undefined, '2hours'));
    strict_1.default.ok(ms >= time + 7200000);
});
//# sourceMappingURL=now.test.js.map