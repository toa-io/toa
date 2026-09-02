"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const Console_js_1 = require("./Console.js");
const tracing_js_1 = require("./tracing.js");
const exporters_js_1 = require("./exporters.js");
const Otlp_js_1 = require("./Otlp.js");
const traces_js_1 = require("./traces.js");
(0, node_test_1.afterEach)(() => {
    (0, traces_js_1.traces)();
});
(0, node_test_1.describe)('traces', () => {
    (0, node_test_1.it)('should default to no exporters', () => {
        (0, traces_js_1.traces)();
        strict_1.default.strictEqual((0, exporters_js_1.exporters)().length, 0);
        strict_1.default.strictEqual((0, exporters_js_1.recording)(), false);
    });
    (0, node_test_1.it)('should opt into the console exporter', () => {
        (0, traces_js_1.traces)({ exporters: { console: {} } });
        strict_1.default.deepStrictEqual((0, exporters_js_1.exporters)(), [exporters_js_1.consoleExporter]);
        strict_1.default.strictEqual((0, exporters_js_1.recording)(), true);
    });
    (0, node_test_1.it)('should create configured exporters', () => {
        (0, traces_js_1.traces)({ exporters: { console: null, otlp: { endpoint: 'http://localhost:4318' } } });
        strict_1.default.strictEqual((0, exporters_js_1.exporters)()[0], exporters_js_1.consoleExporter);
        strict_1.default.ok((0, exporters_js_1.exporters)()[1] instanceof Otlp_js_1.Otlp);
    });
    (0, node_test_1.it)('should disable the console exporter when not listed', () => {
        (0, traces_js_1.traces)({ exporters: { otlp: { endpoint: 'http://localhost:4318' } } });
        strict_1.default.strictEqual((0, exporters_js_1.exporters)().length, 1);
        strict_1.default.ok((0, exporters_js_1.exporters)()[0] instanceof Otlp_js_1.Otlp);
    });
    (0, node_test_1.it)('should share exporters between module copies', async () => {
        // a process may load several copies of the module (the package installed more than once)
        let copy;
        copy = await import('./exporters.js');
        const exporter = { export: () => undefined };
        copy.exporting([exporter]);
        strict_1.default.deepStrictEqual((0, exporters_js_1.exporters)(), [exporter]);
    });
    (0, node_test_1.it)('should flush exporters', async () => {
        const flusher = node_test_1.mock.fn(async () => undefined);
        const exporter = { export: () => undefined, flush: flusher };
        (0, exporters_js_1.exporting)([exporter, exporters_js_1.consoleExporter]); // consoleExporter has no flush
        await (0, exporters_js_1.flush)();
        strict_1.default.ok(flusher.mock.callCount() > 0);
    });
});
(0, node_test_1.describe)('export', () => {
    const streams = {
        stdout: { write: node_test_1.mock.fn() },
        stderr: { write: node_test_1.mock.fn() }
    };
    (0, node_test_1.beforeEach)(() => {
        streams.stdout.write.mock.resetCalls();
    });
    (0, node_test_1.it)('should pass spans to exporters', async () => {
        const seen = [];
        const exporter = { export: (span) => void seen.push(span) };
        (0, exporters_js_1.exporting)([exporter]);
        const instance = new Console_js_1.Console({ streams, context: { component: 'pots' } });
        await instance.span({ name: 'work', kind: 'server', attributes: { foo: 1 } }, () => null);
        strict_1.default.strictEqual(seen.length, 1);
        strict_1.default.partialDeepStrictEqual(seen[0], { name: 'work', kind: 'server', attributes: { foo: 1 }, scope: { component: 'pots' } });
        strict_1.default.match(seen[0]['traceId'], /^[\da-f]{32}$/);
        strict_1.default.match(seen[0]['spanId'], /^[\da-f]{16}$/);
        strict_1.default.strictEqual(typeof seen[0]['time'], 'number');
        strict_1.default.strictEqual(typeof seen[0]['duration'], 'number');
        strict_1.default.strictEqual(streams.stdout.write.mock.callCount(), 0);
    });
    (0, node_test_1.it)('should attribute spans to a service', async () => {
        const seen = [];
        const exporter = { export: (span) => void seen.push(span) };
        (0, exporters_js_1.exporting)([exporter]);
        const instance = new Console_js_1.Console({ streams });
        await instance.span({ name: 'request', service: 'exposition' }, async () => {
            await instance.span('inherited', () => null);
            await instance.span({ name: 'overridden', service: 'orders' }, () => null);
        });
        strict_1.default.deepStrictEqual(seen.map((span) => [span.name, span.service]), [
            ['inherited', 'exposition'],
            ['overridden', 'orders'],
            ['request', 'exposition']
        ]);
    });
    (0, node_test_1.it)('should mark the span as failed through the context', async () => {
        const seen = [];
        const exporter = { export: (span) => void seen.push(span) };
        (0, exporters_js_1.exporting)([exporter]);
        const instance = new Console_js_1.Console({ streams });
        await instance.span('work', () => {
            (0, tracing_js_1.current)().status = 'error';
        });
        strict_1.default.strictEqual(seen[0].status, 'error');
    });
    (0, node_test_1.it)('should fan out to multiple exporters', async () => {
        const first = { export: node_test_1.mock.fn() };
        const second = { export: node_test_1.mock.fn() };
        (0, exporters_js_1.exporting)([first, second]);
        const instance = new Console_js_1.Console({ streams });
        await instance.span('work', () => null);
        strict_1.default.strictEqual(first.export.mock.callCount(), 1);
        strict_1.default.strictEqual(second.export.mock.callCount(), 1);
    });
    (0, node_test_1.it)('should record externally completed spans', () => {
        const seen = [];
        const exporter = { export: (span) => void seen.push(span) };
        (0, exporters_js_1.exporting)([exporter]);
        const span = {
            name: 'find pots',
            traceId: 'a'.repeat(32),
            spanId: 'b'.repeat(16),
            kind: 'client',
            time: Date.now(),
            duration: 1.5
        };
        (0, Console_js_1.record)(span);
        strict_1.default.deepStrictEqual(seen, [span]);
    });
    (0, node_test_1.it)('should not export unsampled spans', async () => {
        const exporter = { export: node_test_1.mock.fn() };
        (0, exporters_js_1.exporting)([exporter]);
        (0, traces_js_1.traces)({ sample: 0, exporters: {} });
        (0, exporters_js_1.exporting)([exporter]);
        const instance = new Console_js_1.Console({ streams });
        await instance.span('work', () => null);
        strict_1.default.strictEqual(exporter.export.mock.callCount(), 0);
    });
});
//# sourceMappingURL=traces.test.js.map