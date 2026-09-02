"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const core_1 = require("@toa.io/core");
const openspan_1 = require("openspan");
const Aspect_js_1 = require("./Aspect.js");
const nativeFetch = globalThis.fetch;
let aspect;
let fetchMock;
let spans;
(0, node_test_1.beforeEach)(() => {
    aspect = new Aspect_js_1.Aspect(new core_1.Locator('users', 'identity'));
    fetchMock = node_test_1.mock.fn();
    globalThis.fetch = fetchMock;
    spans = [];
    (0, openspan_1.exporting)([{ export: (span) => spans.push(span) }]);
});
(0, node_test_1.afterEach)(() => {
    globalThis.fetch = nativeFetch;
    (0, openspan_1.exporting)([openspan_1.consoleExporter]);
});
(0, node_test_1.it)('delegates to native fetch and returns its Response', async () => {
    const response = new Response('ok', { status: 201, headers: { 'x-test': 'yes' } });
    fetchMock.mock.mockImplementation(async () => response);
    const result = await aspect.invoke('create', 'https://example.com/items?secret=yes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}'
    });
    strict_1.default.strictEqual(result, response);
    strict_1.default.strictEqual(fetchMock.mock.callCount(), 1);
    const request = fetchMock.mock.calls[0].arguments[0];
    strict_1.default.ok(request instanceof Request);
    strict_1.default.strictEqual(request.method, 'POST');
    strict_1.default.strictEqual(request.url, 'https://example.com/items?secret=yes');
    await strict_1.default.strictEqual(await request.text(), '{}');
});
(0, node_test_1.it)('does not retry by default', async () => {
    fetchMock.mock.mockImplementation(async () => new Response(null, { status: 503 }));
    const response = await aspect.invoke('get', 'https://example.com');
    strict_1.default.strictEqual(response.status, 503);
    strict_1.default.strictEqual(fetchMock.mock.callCount(), 1);
});
(0, node_test_1.it)('retries unexpected responses and returns an expected response', async () => {
    fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 503 }), fetchMock.mock.callCount());
    fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 201 }), fetchMock.mock.callCount() + 1);
    const response = await aspect.invoke('create', 'https://example.com', {
        retry: { attempts: 3, expected: [201], delay: 0 }
    });
    strict_1.default.strictEqual(response.status, 201);
    strict_1.default.strictEqual(fetchMock.mock.callCount(), 2);
});
(0, node_test_1.it)('cancels an unexpected response body before retrying', async () => {
    const cancel = node_test_1.mock.fn();
    const body = new ReadableStream({ cancel });
    fetchMock.mock.mockImplementationOnce(async () => new Response(body, { status: 503 }), fetchMock.mock.callCount());
    fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 200 }), fetchMock.mock.callCount() + 1);
    await aspect.invoke('get', 'https://example.com', {
        retry: { attempts: 2, delay: 0 }
    });
    strict_1.default.strictEqual(cancel.mock.callCount(), 1);
});
(0, node_test_1.it)('continues retrying when response body cancellation fails', async () => {
    const body = new ReadableStream({
        cancel: () => {
            throw new Error('cancel failed');
        }
    });
    fetchMock.mock.mockImplementationOnce(async () => new Response(body, { status: 503 }), fetchMock.mock.callCount());
    fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 200 }), fetchMock.mock.callCount() + 1);
    const response = await aspect.invoke('get', 'https://example.com', {
        retry: { attempts: 2, delay: 0 }
    });
    strict_1.default.strictEqual(response.status, 200);
});
(0, node_test_1.it)('replays a regular request body', async () => {
    fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 503 }), fetchMock.mock.callCount());
    fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 200 }), fetchMock.mock.callCount() + 1);
    await aspect.invoke('create', 'https://example.com', {
        method: 'POST',
        body: 'hello',
        retry: { attempts: 2, delay: 0 }
    });
    const first = fetchMock.mock.calls[0].arguments[0];
    const second = fetchMock.mock.calls[1].arguments[0];
    await strict_1.default.strictEqual(await first.text(), 'hello');
    await strict_1.default.strictEqual(await second.text(), 'hello');
});
(0, node_test_1.it)('honors Retry-After instead of the configured delay', async () => {
    fetchMock.mock.mockImplementationOnce(async () => new Response(null, {
        status: 503,
        headers: { 'retry-after': '0' }
    }), fetchMock.mock.callCount());
    fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 200 }), fetchMock.mock.callCount() + 1);
    const response = await aspect.invoke('get', 'https://example.com', {
        retry: { attempts: 2, delay: 60_000 }
    });
    strict_1.default.strictEqual(response.status, 200);
    strict_1.default.strictEqual(fetchMock.mock.callCount(), 2);
});
(0, node_test_1.it)('returns the last unexpected response', async () => {
    fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 500 }), fetchMock.mock.callCount());
    fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 502 }), fetchMock.mock.callCount() + 1);
    const response = await aspect.invoke('get', 'https://example.com', {
        retry: { attempts: 2, delay: 0 }
    });
    strict_1.default.strictEqual(response.status, 502);
});
(0, node_test_1.it)('retries network errors and throws the final error', async () => {
    const first = new Error('first');
    const last = new Error('last');
    fetchMock.mock.mockImplementationOnce(async () => { throw first; }, fetchMock.mock.callCount());
    fetchMock.mock.mockImplementationOnce(async () => { throw last; }, fetchMock.mock.callCount() + 1);
    await strict_1.default.rejects(aspect.invoke('get', 'https://example.com', {
        retry: { attempts: 2, delay: 0 }
    }), (error) => { strict_1.default.strictEqual(error, last); return true; });
    strict_1.default.strictEqual(fetchMock.mock.callCount(), 2);
});
(0, node_test_1.it)('aborts while waiting for another attempt', async () => {
    const controller = new AbortController();
    fetchMock.mock.mockImplementation(async () => new Response(null, { status: 503 }));
    const promise = aspect.invoke('get', 'https://example.com', {
        signal: controller.signal,
        retry: { attempts: 2, delay: 60_000 }
    });
    await new Promise((resolve) => setImmediate(resolve));
    controller.abort(new Error('cancelled'));
    await strict_1.default.rejects(promise, (error) => /cancelled/.test(error.message));
    strict_1.default.strictEqual(fetchMock.mock.callCount(), 1);
});
(0, node_test_1.it)('rejects invalid retry options', async () => {
    await strict_1.default.rejects(aspect.invoke('get', 'https://example.com', {
        retry: { attempts: 0 }
    }), (error) => /retry\.attempts/.test(error.message));
    await strict_1.default.rejects(aspect.invoke('get', 'https://example.com', {
        retry: { attempts: 2, expected: [] }
    }), (error) => /retry\.expected/.test(error.message));
});
(0, node_test_1.it)('rejects an explicit streaming body before sending it', async () => {
    const body = new ReadableStream();
    await strict_1.default.rejects(aspect.invoke('create', 'https://example.com', {
        method: 'POST',
        body,
        // Required by Node.js for a streaming request body.
        // @ts-expect-error -- duplex is implemented by Node but absent from lib.dom RequestInit.
        duplex: 'half',
        retry: { attempts: 2 }
    }), (error) => /non-replayable/.test(error.message));
    strict_1.default.strictEqual(fetchMock.mock.callCount(), 0);
});
(0, node_test_1.it)('rejects a Request input with a body before retrying', async () => {
    const request = new Request('https://example.com', { method: 'POST', body: 'hello' });
    await strict_1.default.rejects(aspect.invoke('create', request, {
        retry: { attempts: 2 }
    }), (error) => /non-replayable/.test(error.message));
    strict_1.default.strictEqual(fetchMock.mock.callCount(), 0);
});
(0, node_test_1.it)('creates a scoped parent span with a client span for each attempt', async () => {
    fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 503 }), fetchMock.mock.callCount());
    fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 204 }), fetchMock.mock.callCount() + 1);
    await aspect.invoke('update', 'https://example.com/items?token=secret', {
        method: 'PUT',
        retry: { attempts: 2, delay: 0 }
    });
    strict_1.default.strictEqual(spans.length, 3);
    const parent = spans.find((span) => span.name === 'PUT https://example.com');
    const attempts = spans.filter((span) => span.parentId === parent.spanId);
    strict_1.default.partialDeepStrictEqual(parent, {
        name: 'PUT https://example.com',
        kind: 'internal',
        scope: {
            namespace: 'identity',
            component: 'users',
            operation: 'update'
        },
        attributes: {
            'http.request.method': 'PUT',
            'http.response.status_code': 204,
            'url.scheme': 'https',
            'server.address': 'example.com',
            'retry.attempts': 2
        }
    });
    strict_1.default.partialDeepStrictEqual(attempts, [
        {
            name: 'attempt 1',
            kind: 'client',
            attributes: {
                'retry.attempt': 1,
                'http.response.status_code': 503
            }
        },
        {
            name: 'attempt 2',
            kind: 'client',
            attributes: {
                'retry.attempt': 2,
                'http.response.status_code': 204
            }
        }
    ]);
    strict_1.default.ok(!(JSON.stringify(spans).includes('token=secret')));
});
(0, node_test_1.it)('marks the span as failed after a final network error', async () => {
    fetchMock.mock.mockImplementation(async () => { throw new Error('unavailable'); });
    await strict_1.default.rejects(aspect.invoke('get', 'https://example.com'), (error) => /unavailable/.test(error.message));
    strict_1.default.strictEqual(spans.length, 2);
    strict_1.default.strictEqual(spans.every((span) => span.status === 'error'), true);
});
//# sourceMappingURL=Aspect.test.js.map