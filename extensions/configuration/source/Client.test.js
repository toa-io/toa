"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_util_1 = require("node:util");
const core_1 = require("@toa.io/core");
const generic_1 = require("@toa.io/generic");
const Client_js_1 = require("./Client.js");
const const_js_1 = require("./const.js");
class Remote extends core_1.Connector {
    invoke = node_test_1.mock.fn(async (_endpoint, request) => request.input.map((pair) => ({
        ...pair,
        configuration: this.values[pair.component] ?? null,
        created: this.values[pair.component] === undefined ? 0 : 7
    })));
    values = {};
}
let remote;
let receiver;
let boot;
let client;
(0, node_test_1.beforeEach)(() => {
    remote = new Remote();
    receiver = null;
    boot = {
        remote: node_test_1.mock.fn(async (locator) => {
            strict_1.default.deepStrictEqual(locator.id, 'configuration.values');
            return remote;
        }),
        receive: node_test_1.mock.fn(async (label, consumer) => {
            strict_1.default.deepStrictEqual(label, const_js_1.EVENT);
            receiver = consumer;
            return new core_1.Connector();
        })
    };
    client = new Client_js_1.Client(boot, { base: 10, max: 20, warn: 2 });
});
(0, node_test_1.afterEach)(async () => {
    await client.disconnect();
});
(0, node_test_1.it)('should send the requests of one tick as one call', async () => {
    remote.values = { 'a.one': { foo: 1 }, 'a.two': { foo: 2 } };
    await client.connect();
    const [one, two] = await Promise.all([client.fetch('a.one', 'e1'), client.fetch('a.two', 'e2')]);
    strict_1.default.deepStrictEqual(one, { configuration: { foo: 1 }, created: 7 });
    strict_1.default.deepStrictEqual(two, { configuration: { foo: 2 }, created: 7 });
    strict_1.default.strictEqual(remote.invoke.mock.callCount(), 1);
    strict_1.default.deepStrictEqual(remote.invoke.mock.calls[0].arguments[1], {
        input: [{ component: 'a.one', epoch: 'e1' }, { component: 'a.two', epoch: 'e2' }]
    });
});
(0, node_test_1.it)('should keep asking until served', async () => {
    await client.connect();
    const fetching = client.fetch('a.one', 'e1');
    const deadline = Date.now() + 1000;
    while (remote.invoke.mock.calls.length < 2 && Date.now() < deadline)
        await (0, generic_1.timeout)(5);
    strict_1.default.ok(remote.invoke.mock.calls.length >= 2);
    remote.values = { 'a.one': { foo: 1 } };
    strict_1.default.deepStrictEqual((await fetching).configuration, { foo: 1 });
});
(0, node_test_1.it)('should hand a created object to its subscribers', async () => {
    await client.connect();
    const listener = node_test_1.mock.fn();
    const other = node_test_1.mock.fn();
    client.subscribe('a.one', 'e1', listener);
    client.subscribe('a.one', 'e0', other);
    await receiver.receive({
        payload: { component: 'a.one', epoch: 'e1', configuration: { foo: 2 }, _created: 12 }
    });
    strict_1.default.ok(listener.mock.calls.some((call) => call.arguments.length === 1 && (0, node_util_1.isDeepStrictEqual)(call.arguments[0], { configuration: { foo: 2 }, created: 12 })));
    strict_1.default.strictEqual(other.mock.callCount(), 0);
    strict_1.default.strictEqual(remote.invoke.mock.callCount(), 0);
    client.unsubscribe('a.one', 'e1', listener);
    await receiver.receive({
        payload: { component: 'a.one', epoch: 'e1', configuration: { foo: 3 }, _created: 13 }
    });
    strict_1.default.strictEqual(listener.mock.callCount(), 1);
});
//# sourceMappingURL=Client.test.js.map