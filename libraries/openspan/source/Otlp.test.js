"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_util_1 = require("node:util");
const http = __importStar(require("node:http"));
const Console_js_1 = require("./Console.js");
const Otlp_js_1 = require("./Otlp.js");
let requests = [];
let respond;
let server;
let endpoint;
// an endpoint nothing listens on
const refused = 'http://localhost:1';
(0, node_test_1.before)(async () => {
    server = http.createServer((request, response) => {
        let body = '';
        request.setEncoding('utf8');
        request.on('data', (chunk) => (body += chunk));
        request.on('end', () => {
            requests.push({ method: request.method, url: request.url, headers: request.headers, body });
            respond(response);
        });
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    endpoint = `http://127.0.0.1:${server.address().port}`;
});
(0, node_test_1.after)(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(() => resolve()));
});
(0, node_test_1.beforeEach)(() => {
    requests = [];
    respond = (response) => response.writeHead(200).end();
});
const span = {
    name: 'test',
    traceId: 'a'.repeat(32),
    spanId: 'b'.repeat(16),
    parentId: 'c'.repeat(16),
    kind: 'server',
    time: 1700000000000,
    duration: 12.345,
    attributes: { method: 'GET', attempt: 2, ratio: 0.5, ok: true },
    scope: { component: 'pots' },
    status: 'error'
};
(0, node_test_1.it)('should post spans to the endpoint', async () => {
    const exporter = new Otlp_js_1.Otlp({ endpoint: endpoint + '/' });
    exporter.export(span);
    await exporter.flush();
    strict_1.default.strictEqual(requests.length, 1);
    strict_1.default.partialDeepStrictEqual(requests[0], { method: 'POST', url: '/v1/traces' });
    strict_1.default.strictEqual(requests[0].headers['content-type'], 'application/json');
});
(0, node_test_1.it)('should encode spans as OTLP JSON', async () => {
    const exporter = new Otlp_js_1.Otlp({ endpoint, service: 'my-service' });
    exporter.export(span);
    await exporter.flush();
    const body = JSON.parse(requests[0].body);
    const resource = body.resourceSpans[0];
    const encoded = resource.scopeSpans[0].spans[0];
    strict_1.default.ok(resource.resource.attributes.some((attribute) => (0, node_util_1.isDeepStrictEqual)(attribute, { key: 'service.name', value: { stringValue: 'my-service' } })));
    strict_1.default.partialDeepStrictEqual(encoded, {
        traceId: span.traceId,
        spanId: span.spanId,
        parentSpanId: span.parentId,
        name: 'test',
        kind: 2,
        startTimeUnixNano: '1700000000000000000',
        endTimeUnixNano: '1700000000012345000',
        status: { code: 2 }
    });
    strict_1.default.ok([
        { key: 'component', value: { stringValue: 'pots' } },
        { key: 'method', value: { stringValue: 'GET' } },
        { key: 'attempt', value: { intValue: '2' } },
        { key: 'ratio', value: { doubleValue: 0.5 } },
        { key: 'ok', value: { boolValue: true } }
    ].every((item) => encoded.attributes.some((candidate) => (0, node_util_1.isDeepStrictEqual)(candidate, item))));
});
(0, node_test_1.it)('should batch spans', async () => {
    const exporter = new Otlp_js_1.Otlp({ endpoint });
    exporter.export(span);
    exporter.export({ ...span, name: 'second' });
    await exporter.flush();
    strict_1.default.strictEqual(requests.length, 1);
    const body = JSON.parse(requests[0].body);
    strict_1.default.strictEqual(body.resourceSpans[0].scopeSpans[0].spans.length, 2);
});
(0, node_test_1.it)('should group spans by service', async () => {
    const exporter = new Otlp_js_1.Otlp({ endpoint, service: 'fallback' });
    exporter.export({ ...span, service: 'orders' });
    exporter.export({ ...span, name: 'second', service: 'orders' });
    exporter.export({ ...span, name: 'third' });
    await exporter.flush();
    const body = JSON.parse(requests[0].body);
    strict_1.default.strictEqual(body.resourceSpans.length, 2);
    const services = body.resourceSpans.map((resource) => resource.resource.attributes.find((attribute) => attribute.key === 'service.name').value.stringValue);
    strict_1.default.ok(['orders', 'fallback'].every((item) => services.some((candidate) => (0, node_util_1.isDeepStrictEqual)(candidate, item))));
    const orders = body.resourceSpans[services.indexOf('orders')];
    strict_1.default.strictEqual(orders.scopeSpans[0].spans.length, 2);
});
(0, node_test_1.it)('should send custom headers', async () => {
    const exporter = new Otlp_js_1.Otlp({ endpoint, headers: { authorization: 'Bearer token' } });
    exporter.export(span);
    await exporter.flush();
    strict_1.default.partialDeepStrictEqual(requests[0].headers, { authorization: 'Bearer token' });
});
(0, node_test_1.it)('should not fail on export errors', async () => {
    const exporter = new Otlp_js_1.Otlp({ endpoint: refused });
    exporter.export(span);
    await strict_1.default.strictEqual(await exporter.flush(), undefined);
});
(0, node_test_1.it)('should not fail on serialization errors and keep exporting', async () => {
    const exporter = new Otlp_js_1.Otlp({ endpoint });
    const circular = {};
    circular.self = circular;
    exporter.export({ ...span, attributes: { circular } });
    await strict_1.default.strictEqual(await exporter.flush(), undefined);
    strict_1.default.strictEqual(requests.length, 0);
    exporter.export(span);
    await strict_1.default.strictEqual(await exporter.flush(), undefined);
    strict_1.default.strictEqual(requests.length, 1);
});
(0, node_test_1.it)('should bound a request by the timeout', async () => {
    respond = () => undefined; // never responds
    const exporter = new Otlp_js_1.Otlp({ endpoint, timeout: 50 });
    exporter.export(span);
    // hangs indefinitely unless the request is destroyed
    await strict_1.default.strictEqual(await exporter.flush(), undefined);
});
(0, node_test_1.it)('should drop spans while the endpoint is unavailable', async () => {
    respond = (response) => response.writeHead(503).end();
    const exporter = new Otlp_js_1.Otlp({ endpoint });
    exporter.export(span);
    await exporter.flush();
    strict_1.default.strictEqual(requests.length, 1);
    exporter.export({ ...span, name: 'second' });
    await exporter.flush();
    strict_1.default.strictEqual(requests.length, 1);
});
(0, node_test_1.it)('should warn once while the endpoint is unavailable', async () => {
    const warn = node_test_1.mock.method(Console_js_1.console, 'warn', () => undefined);
    respond = (response) => response.writeHead(503).end();
    // no cooldown: every batch reaches the endpoint
    const exporter = new Otlp_js_1.Otlp({ endpoint, cooldown: 0 });
    exporter.export(span);
    await exporter.flush();
    exporter.export({ ...span, name: 'second' });
    await exporter.flush();
    strict_1.default.strictEqual(requests.length, 2);
    strict_1.default.strictEqual(warn.mock.callCount(), 1);
    warn.mock.restore();
});
(0, node_test_1.it)('should resume exporting when the endpoint recovers', async () => {
    respond = (response) => response.writeHead(503).end();
    const exporter = new Otlp_js_1.Otlp({ endpoint, cooldown: 0 });
    exporter.export(span);
    await exporter.flush();
    respond = (response) => response.writeHead(200).end();
    exporter.export({ ...span, name: 'second' });
    await exporter.flush();
    strict_1.default.strictEqual(requests.length, 2);
    const body = JSON.parse(requests[1].body);
    strict_1.default.strictEqual(body.resourceSpans[0].scopeSpans[0].spans[0].name, 'second');
});
//# sourceMappingURL=Otlp.test.js.map