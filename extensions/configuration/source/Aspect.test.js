"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_util_1 = require("node:util");
const core_1 = require("@toa.io/core");
const randomstring_1 = require("randomstring");
const Aspect_js_1 = require("./Aspect.js");
class Fake extends core_1.Connector {
    fetch = node_test_1.mock.fn(async () => ({ configuration: { foo: 'served' }, created: 5 }));
    subscribe = node_test_1.mock.fn();
    unsubscribe = node_test_1.mock.fn();
}
const manifest = {
    schema: {
        type: 'object',
        properties: {
            foo: { type: 'string' },
            bar: { type: 'object', properties: { baz: { type: 'string' } }, default: { baz: 'quux' } }
        }
    }
};
let locator;
(0, node_test_1.beforeEach)(() => {
    locator = new core_1.Locator((0, randomstring_1.generate)(), (0, randomstring_1.generate)());
});
(0, node_test_1.afterEach)(() => {
    delete process.env['TOA_CONFIGURATION_' + locator.uppercase];
});
(0, node_test_1.it)('should be named', async () => {
    strict_1.default.deepStrictEqual(new Aspect_js_1.Aspect(locator, manifest, null).name, 'configuration');
});
(0, node_test_1.it)('should resolve locally without a client', async () => {
    process.env['TOA_CONFIGURATION_' + locator.uppercase] = JSON.stringify({ foo: 'local' });
    const aspect = new Aspect_js_1.Aspect(locator, manifest, null);
    await aspect.connect();
    strict_1.default.deepStrictEqual(aspect.invoke(), { foo: 'local', bar: { baz: 'quux' } });
    strict_1.default.deepStrictEqual(aspect.invoke(['foo']), 'local');
    strict_1.default.deepStrictEqual(aspect.invoke(['bar', 'baz']), 'quux');
});
(0, node_test_1.it)('should fetch from the client and follow it', async () => {
    const client = new Fake();
    const aspect = new Aspect_js_1.Aspect(locator, manifest, client);
    await aspect.connect();
    strict_1.default.deepStrictEqual(client.connected, true);
    strict_1.default.strictEqual(client.fetch.mock.callCount(), 1);
    const [component, epoch] = client.fetch.mock.calls[0].arguments;
    strict_1.default.deepStrictEqual(component, locator.id);
    strict_1.default.match(epoch, /^[a-f0-9]{64}$/);
    strict_1.default.deepStrictEqual(aspect.invoke(), { foo: 'served', bar: { baz: 'quux' } });
    strict_1.default.ok(client.subscribe.mock.calls.some((call) => call.arguments.length === 3 && (0, node_util_1.isDeepStrictEqual)(call.arguments[0], component) && (0, node_util_1.isDeepStrictEqual)(call.arguments[1], epoch) && typeof call.arguments[2] === 'function'));
    const listener = client.subscribe.mock.calls[0].arguments[2];
    listener({ configuration: { foo: 'updated' }, created: 6 });
    strict_1.default.deepStrictEqual(aspect.invoke(['foo']), 'updated');
    // what is not newer than the held value is left alone
    listener({ configuration: { foo: 'stale' }, created: 6 });
    listener({ configuration: { foo: 'older' }, created: 4 });
    strict_1.default.deepStrictEqual(aspect.invoke(['foo']), 'updated');
    // a value that does not fit keeps the previous one
    listener({ configuration: { foo: { nested: true } }, created: 7 });
    strict_1.default.deepStrictEqual(aspect.invoke(['foo']), 'updated');
    // and the one after it still applies
    listener({ configuration: { foo: 'latest' }, created: 8 });
    strict_1.default.deepStrictEqual(aspect.invoke(['foo']), 'latest');
    await aspect.disconnect();
    strict_1.default.ok(client.unsubscribe.mock.calls.some((call) => call.arguments.length === 3 && (0, node_util_1.isDeepStrictEqual)(call.arguments[0], component) && (0, node_util_1.isDeepStrictEqual)(call.arguments[1], epoch) && (0, node_util_1.isDeepStrictEqual)(call.arguments[2], listener)));
});
//# sourceMappingURL=Aspect.test.js.map