"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const tracing_js_1 = require("./tracing.js");
const exporters_js_1 = require("./exporters.js");
const exporter = { export: () => undefined };
// a trace is only sampled if something consumes what it records
(0, node_test_1.beforeEach)(() => {
    (0, exporters_js_1.exporting)([exporter]);
});
(0, node_test_1.afterEach)(() => {
    (0, tracing_js_1.sampling)();
    (0, exporters_js_1.exporting)([]);
});
(0, node_test_1.describe)('create', () => {
    (0, node_test_1.it)('should create root context', () => {
        const context = (0, tracing_js_1.create)();
        strict_1.default.match(context.traceId, /^[\da-f]{32}$/);
        strict_1.default.match(context.spanId, /^[\da-f]{16}$/);
        strict_1.default.strictEqual(context.parentId, undefined);
        strict_1.default.strictEqual(context.sampled, true);
    });
    (0, node_test_1.it)('should create child context', () => {
        const parent = (0, tracing_js_1.create)();
        const child = (0, tracing_js_1.create)(parent);
        strict_1.default.strictEqual(child.traceId, parent.traceId);
        strict_1.default.notStrictEqual(child.spanId, parent.spanId);
        strict_1.default.strictEqual(child.parentId, parent.spanId);
    });
    (0, node_test_1.it)('should inherit sampled flag', () => {
        const parent = { ...(0, tracing_js_1.create)(), sampled: false };
        const child = (0, tracing_js_1.create)(parent);
        strict_1.default.strictEqual(child.sampled, false);
    });
});
(0, node_test_1.describe)('sampling', () => {
    (0, node_test_1.it)('should not sample when nothing consumes spans', () => {
        (0, exporters_js_1.exporting)([]);
        for (let i = 0; i < 10; i++)
            strict_1.default.strictEqual((0, tracing_js_1.decide)(), false);
    });
    (0, node_test_1.it)('should sample once an exporter is configured', () => {
        (0, exporters_js_1.exporting)([]);
        strict_1.default.strictEqual((0, tracing_js_1.decide)(), false);
        (0, exporters_js_1.exporting)([exporter]);
        strict_1.default.strictEqual((0, tracing_js_1.decide)(), true);
    });
    (0, node_test_1.it)('should sample all traces by default', () => {
        for (let i = 0; i < 10; i++)
            strict_1.default.strictEqual((0, tracing_js_1.decide)(), true);
    });
    (0, node_test_1.it)('should not sample when sample is 0', () => {
        (0, tracing_js_1.sampling)({ sample: 0 });
        for (let i = 0; i < 10; i++)
            strict_1.default.strictEqual((0, tracing_js_1.create)().sampled, false);
    });
    (0, node_test_1.it)('should not re-decide for children', () => {
        (0, tracing_js_1.sampling)({ sample: 0 });
        const parent = { ...(0, tracing_js_1.create)(), sampled: true };
        strict_1.default.strictEqual((0, tracing_js_1.create)(parent).sampled, true);
    });
    (0, node_test_1.it)('should limit the rate of recorded traces', () => {
        (0, tracing_js_1.sampling)({ rate: 2 });
        const decisions = Array.from({ length: 10 }, () => (0, tracing_js_1.create)().sampled);
        strict_1.default.strictEqual(decisions.filter(Boolean).length, 2);
    });
    (0, node_test_1.it)('should refill the bucket over time', async () => {
        (0, tracing_js_1.sampling)({ rate: 100 });
        while ((0, tracing_js_1.decide)())
            ;
        strict_1.default.strictEqual((0, tracing_js_1.decide)(), false);
        await new Promise((resolve) => setTimeout(resolve, 30));
        strict_1.default.strictEqual((0, tracing_js_1.decide)(), true);
    });
    (0, node_test_1.it)('should allow at least one trace for fractional rate', () => {
        (0, tracing_js_1.sampling)({ rate: 0.1 });
        strict_1.default.strictEqual((0, tracing_js_1.decide)(), true);
        strict_1.default.strictEqual((0, tracing_js_1.decide)(), false);
    });
});
(0, node_test_1.describe)('traceparent', () => {
    (0, node_test_1.it)('should roundtrip', () => {
        const context = (0, tracing_js_1.create)();
        const decoded = (0, tracing_js_1.decode)((0, tracing_js_1.encode)(context));
        strict_1.default.partialDeepStrictEqual(decoded, {
            traceId: context.traceId,
            spanId: context.spanId,
            sampled: true
        });
    });
    (0, node_test_1.it)('should encode sampled flag', () => {
        const context = { ...(0, tracing_js_1.create)(), sampled: false };
        strict_1.default.match((0, tracing_js_1.encode)(context), /-00$/);
        strict_1.default.strictEqual((0, tracing_js_1.decode)((0, tracing_js_1.encode)(context))?.sampled, false);
    });
    for (const [_, header] of [
        ['garbage', 'garbage'],
        ['wrong version', '01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'],
        ['short trace id', '00-4bf92f3577b34da6-00f067aa0ba902b7-01'],
        ['uppercase hex', '00-4BF92F3577B34DA6A3CE929D0E0E4736-00f067aa0ba902b7-01'],
        ['zero trace id', '00-00000000000000000000000000000000-00f067aa0ba902b7-01'],
        ['zero span id', '00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01']
    ])
        (0, node_test_1.it)(`should reject ${_}`, () => {
            strict_1.default.strictEqual((0, tracing_js_1.decode)(header), null);
        });
});
(0, node_test_1.describe)('module copies', () => {
    // a process may load several copies of the module (the package installed more than once)
    let copy;
    (0, node_test_1.beforeEach)(async () => {
        copy = await import('./tracing.js');
    });
    (0, node_test_1.it)('should share the context', () => {
        const context = (0, tracing_js_1.create)();
        (0, tracing_js_1.run)(context, () => strict_1.default.strictEqual(copy.current(), context));
    });
    (0, node_test_1.it)('should share the sampling configuration', () => {
        copy.sampling({ sample: 0 });
        strict_1.default.strictEqual((0, tracing_js_1.decide)(), false);
    });
    (0, node_test_1.it)('should share the rate limit', () => {
        copy.sampling({ rate: 1 });
        strict_1.default.strictEqual((0, tracing_js_1.decide)(), true);
        strict_1.default.strictEqual(copy.decide(), false);
    });
});
(0, node_test_1.describe)('run', () => {
    (0, node_test_1.it)('should expose context within callback', () => {
        const context = (0, tracing_js_1.create)();
        strict_1.default.strictEqual((0, tracing_js_1.current)(), undefined);
        (0, tracing_js_1.run)(context, () => strict_1.default.strictEqual((0, tracing_js_1.current)(), context));
        strict_1.default.strictEqual((0, tracing_js_1.current)(), undefined);
    });
    (0, node_test_1.it)('should isolate concurrent chains', async () => {
        const seen = [];
        async function chain(id) {
            await (0, tracing_js_1.run)({ ...(0, tracing_js_1.create)(), traceId: id.repeat(32) }, async () => {
                await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
                seen.push(`${id}:${(0, tracing_js_1.current)()?.traceId[0]}`);
            });
        }
        await Promise.all([chain('a'), chain('b'), chain('c')]);
        strict_1.default.deepStrictEqual(seen.sort(), ['a:a', 'b:b', 'c:c']);
    });
});
//# sourceMappingURL=tracing.test.js.map