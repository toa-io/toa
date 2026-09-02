"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
/* eslint-disable no-template-curly-in-string */
const Captures_js_1 = require("./Captures.js");
let captures;
(0, node_test_1.beforeEach)(() => {
    captures = new Captures_js_1.Captures();
});
(0, node_test_1.it)('should capture parts of the source', () => {
    captures.capture('hello world', 'hello ${{ word }}');
    const word = captures.get('word');
    strict_1.default.strictEqual(word, 'world');
});
(0, node_test_1.it)('should not capture parts of the words', () => {
    captures.capture('super-hello world', 'hello ${{ word }}');
    const word = captures.get('word');
    strict_1.default.strictEqual(word, undefined);
});
(0, node_test_1.it)('should substitute multiple times', () => {
    captures.set('word', 'foo');
    strict_1.default.deepStrictEqual(captures.capture('hey foo foo', 'hey ${{ word }} ${{ word }}'), []);
    strict_1.default.strictEqual(captures.capture('hey foo bar', 'hey ${{ word }} ${{ word }}'), null);
});
(0, node_test_1.it)('should substitute parts of the words', () => {
    captures.set('host', 'domain.com');
    strict_1.default.strictEqual(captures.capture('foo', 'https://${{ host }}/path'), null);
    strict_1.default.deepStrictEqual(captures.capture('https://domain.com/path', 'https://${{ host }}/path'), []);
});
(0, node_test_1.it)('should substitute padded', () => {
    captures.set('one', 'one');
    captures.set('two', 'two');
    const result = captures.substitute(`
    object:
      \${{ one }}: ok
      \${{ two }}: ok
  `);
    console.log(result);
});
(0, node_test_1.describe)('pipelines', () => {
    (0, node_test_1.it)('should generate id', () => {
        const result = captures.substitute('hello #{{ id }}');
        strict_1.default.match(result, /^hello [a-z0-9]{32}$/);
    });
    (0, node_test_1.it)('should set variable', () => {
        const result = captures.substitute('hello #{{ id | set test }}');
        strict_1.default.match(result, /^hello [a-z0-9]{32}$/);
        strict_1.default.match(captures.get('test'), /^[a-z0-9]{32}$/);
    });
    (0, node_test_1.it)('should get variable', () => {
        captures.set('foo', 'world');
        strict_1.default.strictEqual(captures.substitute('hello #{{ get foo }}'), 'hello world');
    });
    (0, node_test_1.it)('should encode basic credentials', () => {
        captures.set('Bubba.username', 'bubba');
        captures.set('Bubba.password', 'password');
        const result = captures.substitute('Basic #{{ basic Bubba }}');
        strict_1.default.strictEqual(result, 'Basic YnViYmE6cGFzc3dvcmQ=');
    });
    (0, node_test_1.it)('should generate password', () => {
        strict_1.default.match(captures.substitute('#{{ password }}'), /^.{16}$/);
        strict_1.default.match(captures.substitute('#{{ password 8 }}'), /^.{8}$/);
    });
    (0, node_test_1.it)('should generate email', () => {
        strict_1.default.match(captures.substitute('#{{ email }}'), /^.*@agent\.test$/);
        strict_1.default.match(captures.substitute('#{{ email @example.com }}'), /^.*@example\.com$/);
    });
    (0, node_test_1.it)('should generate random basic credentials', () => {
        const credentials = captures.substitute('#{{ basic }}');
        const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');
        strict_1.default.match(username, /^.*@agent\.test$/);
        strict_1.default.match(password, /^.{16}$/);
    });
    (0, node_test_1.it)('should substitute now', () => {
        // non-deterministic :(
        const now = Date.now().toString().slice(0, -3);
        const past = (Date.now() - 86400000).toString().slice(0, -3);
        const nowRx = new RegExp(`hello ${now}\\d{2}`);
        const pastRx = new RegExp(`hello ${past}\\d{2}`);
        strict_1.default.match(captures.substitute('hello #{{ now }}'), nowRx);
        strict_1.default.match(captures.substitute('hello #{{ now -86400000 }}'), pastRx);
    });
    (0, node_test_1.it)('should convert date to utc string', () => {
        const now = new Date().toUTCString().slice(0, -7);
        const past = new Date(Date.now() - 86400000).toUTCString().slice(0, -7);
        const nowRx = new RegExp(`hello ${now}:\\d{2} GMT`);
        const pastRx = new RegExp(`hello ${past}:\\d{2} GMT`);
        strict_1.default.match(captures.substitute('hello #{{ utc }}'), nowRx);
        strict_1.default.match(captures.substitute('hello #{{ now | utc }}'), nowRx);
        strict_1.default.match(captures.substitute('hello #{{ now -86400000 | utc }}'), pastRx);
    });
    (0, node_test_1.it)('should convert to timestamp', () => {
        const timestamp = Math.floor(Date.now() / 1000);
        strict_1.default.strictEqual(captures.substitute('hello #{{ now | utc | unix }}'), `hello ${timestamp}`);
    });
    (0, node_test_1.it)('should print', () => {
        captures.substitute('hello #{{ now | print }}');
        // look at the console
    });
    (0, node_test_1.it)('should execute custom function', () => {
        const functions = {
            // eslint-disable-next-line max-params
            concat: function (value, a, b) {
                return a + b;
            }
        };
        const captures = new Captures_js_1.Captures(functions);
        strict_1.default.strictEqual(captures.substitute('#{{ concat foo bar }}'), 'foobar');
    });
});
//# sourceMappingURL=Captures.test.js.map