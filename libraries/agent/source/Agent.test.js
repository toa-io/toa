"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
/* eslint-disable no-template-curly-in-string */
const Agent_js_1 = require("./Agent.js");
let agent;
(0, node_test_1.beforeEach)(() => {
    agent = new Agent_js_1.Agent();
});
(0, node_test_1.it)('should match lines in order with headers in between', () => {
    agent.response = '201 Created\n' +
        'server: Exposition/1.0.0\n' +
        'authorization: Token v3.local.eziy\n' +
        '\n' +
        'id: abc-123';
    const expected = '\n' +
        '      201 Created\n' +
        '      authorization: Token ${{ identity.token }} \n' +
        '\n' +
        '      id: ${{ identity.id }}\n' +
        '    ';
    strict_1.default.doesNotThrow(() => agent.responseIncludes(expected));
    strict_1.default.strictEqual(agent.captures.get('identity.token'), 'v3.local.eziy');
    strict_1.default.strictEqual(agent.captures.get('identity.id'), 'abc-123');
});
(0, node_test_1.it)('should not match lines out of order', () => {
    agent.response = 'line 1\nline 2';
    strict_1.default.throws(() => agent.responseIncludes('line 2\nline 1'), (error) => /missing 'line 1'/.test(error.message));
});
//# sourceMappingURL=Agent.test.js.map