"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_util_1 = require("node:util");
const Ready_js_1 = require("./Ready.js");
let send;
let original;
(0, node_test_1.beforeEach)(() => {
    original = process.send;
    send = node_test_1.mock.fn();
    process.send = send;
});
(0, node_test_1.afterEach)(() => {
    process.send = original;
});
(0, node_test_1.it)('should signal readiness', async () => {
    const ready = Ready_js_1.Ready.create();
    await ready.connect();
    await ready.complete();
    strict_1.default.ok(send.mock.calls.some((call) => call.arguments.length === 1 && (0, node_util_1.isDeepStrictEqual)(call.arguments[0], 'ready')));
    await ready.disconnect();
});
// pm2 `wait_ready` blocks until `listen_timeout` when a process never signals,
// and processes sharing a host share the probe port
(0, node_test_1.it)('should signal readiness when the probe port is taken', async () => {
    const first = Ready_js_1.Ready.create();
    const second = Ready_js_1.Ready.create();
    await first.connect();
    await second.connect();
    await second.complete();
    strict_1.default.ok(send.mock.calls.some((call) => call.arguments.length === 1 && (0, node_util_1.isDeepStrictEqual)(call.arguments[0], 'ready')));
    await first.disconnect();
    await second.disconnect();
});
//# sourceMappingURL=Ready.test.js.map