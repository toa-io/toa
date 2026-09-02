"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const index_js_1 = require("./index.js");
(0, node_test_1.afterEach)(() => {
    (0, index_js_1.sampling)();
    (0, index_js_1.exporting)([]);
});
let instance;
const streams = {
    stdout: {
        write: node_test_1.mock.fn()
    },
    stderr: {
        write: node_test_1.mock.fn()
    }
};
const context = {
    foo: 'bar',
    baz: 42
};
const channels = ['trace', 'debug', 'info', 'warn', 'error'];
(0, node_test_1.beforeEach)(() => {
    resetCalls();
    instance = new index_js_1.Console({ streams, context });
});
(0, node_test_1.it)('should be', async () => {
    strict_1.default.notStrictEqual(instance, undefined);
});
for (const severity of channels)
    (0, node_test_1.describe)(`${severity}`, () => {
        const channel = severity === 'error' ? streams.stderr : streams.stdout;
        (0, node_test_1.it)('should write', () => {
            instance[severity]('hello');
            strict_1.default.ok(channel.write.mock.callCount() > 0);
            strict_1.default.partialDeepStrictEqual(pop(channel), {
                severity: severity.toUpperCase(),
                message: 'hello'
            });
        });
        (0, node_test_1.it)('should format message', () => {
            instance[severity]('hello world');
            const subject = pop(channel);
            strict_1.default.partialDeepStrictEqual(subject, { message: 'hello world' });
            strict_1.default.strictEqual(typeof subject['time'], 'string');
        });
        (0, node_test_1.it)('should add context', () => {
            instance[severity]('hello');
            strict_1.default.partialDeepStrictEqual(pop(channel), {
                context
            });
        });
        (0, node_test_1.it)('should add attributes', async () => {
            const attributes = {
                foo: 'baz',
                baz: 24
            };
            instance[severity]('hello world', attributes);
            strict_1.default.partialDeepStrictEqual(pop(channel), { attributes });
        });
    });
(0, node_test_1.it)('should not print below given level', () => {
    instance.configure({ level: 'warn' });
    instance.info('a');
    instance.error('b');
    strict_1.default.strictEqual(pop(streams.stdout), undefined);
    strict_1.default.notStrictEqual(pop(streams.stderr), undefined);
});
(0, node_test_1.it)('should consider log() as debug()', async () => {
    instance.log('foo');
    const entry = pop(streams.stdout);
    strict_1.default.partialDeepStrictEqual(entry, { severity: 'DEBUG' });
});
(0, node_test_1.it)('should share the singleton between module copies', async () => {
    const copy = await import('./Console.js');
    strict_1.default.strictEqual(copy.console, index_js_1.console);
});
for (const channel of channels)
    (0, node_test_1.describe)(`console instance (${channel})`, () => {
        (0, node_test_1.it)('should print message', () => {
            index_js_1.console[channel]('Hello');
        });
        (0, node_test_1.it)('should print attributes', async () => {
            index_js_1.console[channel]('Hello again', { foo: 42 });
        });
    });
(0, node_test_1.it)('should fork', async () => {
    const con = instance.fork({ bar: 'foo' });
    con.debug('hello');
    strict_1.default.partialDeepStrictEqual(pop(streams.stdout), {
        context: { foo: 'bar', baz: 42, bar: 'foo' }
    });
});
(0, node_test_1.it)('should not log undefined attributes', async () => {
    instance.info('hello', undefined);
    const entry = pop(streams.stdout);
    strict_1.default.strictEqual('attributes' in entry, false);
    strict_1.default.strictEqual(entry.message, 'hello');
});
(0, node_test_1.it)('should log empty objects', () => {
    instance.info('foo', { foo: {}, bar: 'baz' });
    instance.info('bar', {});
    instance.info('baz');
});
(0, node_test_1.it)('should log Error', () => {
    instance.info('foo', new Error('ok'));
    instance.info('foo', { error: new Error('ok') });
});
(0, node_test_1.it)('should serialize Error with stack', () => {
    const error = Object.assign(new Error('oops'), { code: 'E_TEST' });
    instance.error('Failed', error);
    const entry = pop(streams.stderr);
    strict_1.default.partialDeepStrictEqual(entry.attributes, {
        message: 'oops',
        code: 'E_TEST'
    });
    strict_1.default.ok(entry.attributes.stack.includes('Error: oops'));
});
(0, node_test_1.it)('should serialize Error cause chain', () => {
    const root = new Error('root');
    const error = new Error('wrapper', { cause: root });
    instance.error('Failed', error);
    const entry = pop(streams.stderr);
    strict_1.default.strictEqual(entry.attributes.message, 'wrapper');
    strict_1.default.strictEqual(entry.attributes.cause.message, 'root');
    strict_1.default.ok(entry.attributes.cause.stack.includes('Error: root'));
});
(0, node_test_1.it)('should serialize non-Error cause', () => {
    const error = new Error('wrapper', { cause: 'just a string' });
    instance.error('Failed', error);
    const entry = pop(streams.stderr);
    strict_1.default.strictEqual(entry.attributes.cause, 'just a string');
});
(0, node_test_1.it)('should log null', () => {
    instance.info('foo', { foo: null });
});
(0, node_test_1.describe)('tracing', () => {
    (0, node_test_1.it)('should stamp trace_id and span_id within context', () => {
        const context = (0, index_js_1.create)();
        (0, index_js_1.run)(context, () => instance.info('hello'));
        strict_1.default.partialDeepStrictEqual(pop(streams.stdout), {
            trace_id: context.traceId,
            span_id: context.spanId
        });
    });
    (0, node_test_1.it)('should not stamp outside of context', () => {
        instance.info('hello');
        const entry = pop(streams.stdout);
        strict_1.default.strictEqual('trace_id' in entry, false);
        strict_1.default.strictEqual('span_id' in entry, false);
    });
});
(0, node_test_1.describe)('span', () => {
    // a span that nothing consumes is not created at all
    (0, node_test_1.beforeEach)(() => {
        (0, index_js_1.exporting)([index_js_1.consoleExporter]);
    });
    (0, node_test_1.it)('should return task result', async () => {
        const result = await instance.span('task', () => 42);
        strict_1.default.strictEqual(result, 42);
    });
    (0, node_test_1.it)('should not open a span within an unsampled trace', async () => {
        const context = { ...(0, index_js_1.create)(), sampled: false };
        const inner = await (0, index_js_1.run)(context, async () => await instance.span('work', () => (0, index_js_1.current)()));
        // the context in scope is reused rather than replaced, so there is nothing to propagate
        strict_1.default.strictEqual(inner, context);
        strict_1.default.strictEqual(streams.stdout.write.mock.callCount(), 0);
    });
    (0, node_test_1.it)('should still run the task when nothing consumes spans', async () => {
        (0, index_js_1.exporting)([]);
        const context = { ...(0, index_js_1.create)(), sampled: false };
        const result = await (0, index_js_1.run)(context, async () => await instance.span('work', () => 42));
        strict_1.default.strictEqual(result, 42);
        strict_1.default.strictEqual(streams.stdout.write.mock.callCount(), 0);
    });
    (0, node_test_1.it)('should write span entry with duration', async () => {
        await instance.span('fetch', async () => await new Promise((resolve) => setTimeout(resolve, 10)));
        const entry = pop(streams.stdout);
        strict_1.default.partialDeepStrictEqual(entry, { severity: 'TRACE', message: 'fetch' });
        strict_1.default.match(entry['trace_id'], /^[\da-f]{32}$/);
        strict_1.default.match(entry['span_id'], /^[\da-f]{16}$/);
        strict_1.default.strictEqual(typeof entry['duration'], 'number');
        strict_1.default.ok(entry.duration >= 5);
        strict_1.default.strictEqual('status' in entry, false);
    });
    (0, node_test_1.it)('should write attributes', async () => {
        await instance.span('fetch', { url: 'example.com' }, () => null);
        strict_1.default.partialDeepStrictEqual(pop(streams.stdout), {
            attributes: { url: 'example.com' }
        });
    });
    (0, node_test_1.it)('should nest spans', async () => {
        await instance.span('outer', async () => {
            await instance.span('inner', () => null);
        });
        const inner = pop(streams.stdout);
        const outer = JSON.parse(streams.stdout.write.mock.calls[1].arguments[0].toString());
        strict_1.default.strictEqual(inner.message, 'inner');
        strict_1.default.strictEqual(outer.message, 'outer');
        strict_1.default.strictEqual(inner.trace_id, outer.trace_id);
        strict_1.default.strictEqual(inner.parent_id, outer.span_id);
    });
    (0, node_test_1.it)('should link logs to the span', async () => {
        await instance.span('work', () => instance.info('step'));
        const log = pop(streams.stdout);
        const span = JSON.parse(streams.stdout.write.mock.calls[1].arguments[0].toString());
        strict_1.default.strictEqual(log.message, 'step');
        strict_1.default.strictEqual(log.trace_id, span.trace_id);
        strict_1.default.strictEqual(log.span_id, span.span_id);
    });
    (0, node_test_1.it)('should continue current trace', async () => {
        const context = (0, index_js_1.create)();
        await (0, index_js_1.run)(context, async () => await instance.span('work', () => null));
        strict_1.default.partialDeepStrictEqual(pop(streams.stdout), {
            trace_id: context.traceId,
            parent_id: context.spanId
        });
    });
    (0, node_test_1.it)('should rethrow and mark status on failure', async () => {
        const oops = new Error('oops');
        await strict_1.default.rejects(instance.span('work', () => Promise.reject(oops)), oops);
        const subject = pop(streams.stdout);
        strict_1.default.partialDeepStrictEqual(subject, { severity: 'TRACE', message: 'work', status: 'error' });
        strict_1.default.strictEqual(typeof subject['duration'], 'number');
    });
    (0, node_test_1.it)('should write span kind', async () => {
        await instance.span({ name: 'handle', kind: 'server' }, () => null);
        strict_1.default.partialDeepStrictEqual(pop(streams.stdout), { kind: 'server' });
    });
    (0, node_test_1.it)('should omit internal kind', async () => {
        await instance.span({ name: 'step', kind: 'internal' }, () => null);
        const entry = pop(streams.stdout);
        strict_1.default.strictEqual('kind' in entry, false);
    });
    (0, node_test_1.it)('should suppress span entries above trace level', async () => {
        instance.configure({ level: 'debug' });
        const result = await instance.span('quiet', () => 'done');
        strict_1.default.strictEqual(result, 'done');
        strict_1.default.strictEqual(pop(streams.stdout), undefined);
    });
    (0, node_test_1.it)('should not write span entries of unsampled traces', async () => {
        (0, index_js_1.sampling)({ sample: 0 });
        const result = await instance.span('unsampled', () => 'done');
        strict_1.default.strictEqual(result, 'done');
        strict_1.default.strictEqual(pop(streams.stdout), undefined);
    });
    (0, node_test_1.it)('should stamp trace_id into logs of unsampled traces', async () => {
        (0, index_js_1.sampling)({ sample: 0 });
        await instance.span('unsampled', () => instance.info('step'));
        const log = pop(streams.stdout);
        strict_1.default.strictEqual(log.message, 'step');
        strict_1.default.match(log.trace_id, /^[\da-f]{32}$/);
    });
});
function pop(channel) {
    const buffer = channel.write.mock.calls[0]?.arguments[0];
    if (buffer === undefined)
        return undefined;
    return JSON.parse(buffer.toString());
}
function resetCalls(target = [streams, context, channels], seen = new Set()) {
    if (target === null || typeof target !== 'object' || seen.has(target))
        return;
    seen.add(target);
    for (const value of Object.values(target))
        if (typeof value === 'function' && value.mock !== undefined)
            value.mock.resetCalls();
        else
            resetCalls(value, seen);
}
//# sourceMappingURL=Console.test.js.map