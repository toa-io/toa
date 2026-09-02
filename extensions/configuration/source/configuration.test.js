"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const core_1 = require("@toa.io/core");
const randomstring_1 = require("randomstring");
const configuration_js_1 = require("./configuration.js");
const Secret_js_1 = require("./Secret.js");
let locator;
let manifest;
(0, node_test_1.beforeEach)(() => {
    locator = new core_1.Locator((0, randomstring_1.generate)(), (0, randomstring_1.generate)());
    manifest = {
        schema: {
            type: 'object',
            properties: { foo: { type: 'string' } }
        }
    };
});
(0, node_test_1.afterEach)(() => {
    for (const name of used)
        delete process.env[name];
    used = [];
});
(0, node_test_1.describe)('overridden', () => {
    (0, node_test_1.it)('should be false without the variable', async () => {
        strict_1.default.deepStrictEqual((0, configuration_js_1.overridden)(locator), false);
    });
    (0, node_test_1.it)('should be true with the variable', async () => {
        set({});
        strict_1.default.deepStrictEqual((0, configuration_js_1.overridden)(locator), true);
    });
});
(0, node_test_1.describe)('local', () => {
    (0, node_test_1.it)('should read value', async () => {
        const value = { foo: (0, randomstring_1.generate)() };
        set(value);
        strict_1.default.deepStrictEqual((0, configuration_js_1.local)(locator, manifest), value);
    });
    (0, node_test_1.it)('should return empty object if no value set', async () => {
        strict_1.default.deepStrictEqual((0, configuration_js_1.local)(locator, manifest), {});
    });
    (0, node_test_1.it)('should substitute secrets', async () => {
        set({ foo: '$BAR' });
        set('bar', '_BAR');
        const { foo } = (0, configuration_js_1.local)(locator, manifest);
        strict_1.default.ok(foo instanceof Secret_js_1.Secret);
        strict_1.default.deepStrictEqual(foo.unwrap(), 'bar');
        strict_1.default.deepStrictEqual(String(foo), '<REDACTED>');
    });
    (0, node_test_1.it)('should substitute secrets in defaults', async () => {
        manifest.defaults = { foo: '$BAR' };
        set('bar', '_BAR');
        strict_1.default.deepStrictEqual((0, configuration_js_1.local)(locator, manifest).foo.unwrap(), 'bar');
    });
    (0, node_test_1.it)('should use defaults', async () => {
        manifest.schema = {
            type: 'object',
            properties: {
                foo: { type: 'string' },
                bar: { type: 'array', items: { type: 'number' } },
                baz: { type: 'string' }
            },
            required: ['foo', 'bar']
        };
        manifest.defaults = { foo: 'bar', bar: [1] };
        set({ bar: [2], baz: 'foo' });
        strict_1.default.deepStrictEqual((0, configuration_js_1.local)(locator, manifest), { foo: 'bar', bar: [2], baz: 'foo' });
    });
    (0, node_test_1.it)('should validate', async () => {
        manifest.schema = {
            type: 'object',
            properties: {
                foo: { type: 'string', default: 'hello' },
                bar: { type: 'number' }
            }
        };
        set({ bar: 5 });
        strict_1.default.deepStrictEqual((0, configuration_js_1.local)(locator, manifest), { foo: 'hello', bar: 5 });
    });
});
(0, node_test_1.describe)('fit', () => {
    (0, node_test_1.it)('should substitute secrets and apply the schema', async () => {
        manifest.schema = {
            type: 'object',
            properties: {
                foo: { type: 'string' },
                bar: { type: 'number', default: 1 }
            }
        };
        set('secret', '_FOO');
        const raw = { foo: '$FOO' };
        const values = (0, configuration_js_1.fit)(raw, manifest);
        strict_1.default.deepStrictEqual(values.foo.unwrap(), 'secret');
        strict_1.default.deepStrictEqual(values.bar, 1);
        strict_1.default.deepStrictEqual(raw, { foo: '$FOO' }); // untouched
    });
    (0, node_test_1.it)('should not apply the manifest defaults', async () => {
        manifest.defaults = { foo: 'hello' };
        strict_1.default.deepStrictEqual((0, configuration_js_1.fit)({}, manifest), {});
    });
    (0, node_test_1.it)('should throw on a value not fitting the schema', async () => {
        strict_1.default.throws(() => (0, configuration_js_1.fit)({ foo: { nested: true } }, manifest));
    });
});
function set(value, key = locator.uppercase) {
    const string = typeof value === 'string' ? value : JSON.stringify(value);
    const name = 'TOA_CONFIGURATION_' + key;
    process.env[name] = string;
    used.push(name);
}
let used = [];
//# sourceMappingURL=configuration.test.js.map