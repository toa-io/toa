"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const request_js_1 = require("./request.js");
(0, node_test_1.it)('should parse headers', () => {
    const http = 'GET / HTTP/1.1\n' +
        'host: localhost:3000\n' +
        '\n';
    const result = (0, request_js_1.request)(http);
    strict_1.default.deepStrictEqual(result.headers.get('host'), 'localhost:3000');
});
(0, node_test_1.it)('should parse body', () => {
    const http = 'POST / HTTP/1.1\n' +
        'host: localhost:3000\n' +
        'content-type: text/plain\n' +
        'content-length: 11\n' +
        '\n' +
        'hello world';
    const result = (0, request_js_1.request)(http);
    strict_1.default.deepStrictEqual(result.body?.toString(), 'hello world');
    strict_1.default.deepStrictEqual(result.headers.get('host'), 'localhost:3000');
});
(0, node_test_1.it)('should add default host header', () => {
    const http = 'GET / HTTP/1.1\n' +
        '\n';
    const result = (0, request_js_1.request)(http, 'https://foo.bar');
    strict_1.default.deepStrictEqual(result.headers.get('host'), 'foo.bar');
});
//# sourceMappingURL=request.test.js.map