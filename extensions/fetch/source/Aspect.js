"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Aspect = void 0;
const core_1 = require("@toa.io/core");
const openspan_1 = require("openspan");
class Aspect extends core_1.Connector {
    name = 'fetch';
    locator;
    consoles = {};
    constructor(locator) {
        super();
        this.locator = locator;
    }
    async invoke(operation, input, init) {
        const { retry, ...nativeInit } = init ?? {};
        const body = nativeInit.body ?? (input instanceof Request ? input.body : null);
        if (retry !== undefined && retry.attempts > 1 && body instanceof ReadableStream)
            throw new TypeError('Cannot retry a request with a non-replayable body');
        const request = new Request(input, nativeInit);
        const attributes = {
            'http.request.method': request.method,
            'url.scheme': requestURL(request).protocol.slice(0, -1),
            'server.address': requestURL(request).hostname
        };
        const url = requestURL(request);
        if (url.port !== '')
            attributes['server.port'] = Number(url.port);
        const options = {
            name: `${request.method} ${url.origin}`,
            kind: 'internal',
            attributes
        };
        const output = this.output(operation);
        return await output.span(options, async () => {
            const response = await invoke(request, retry, { output, parentAttributes: attributes });
            attributes['http.response.status_code'] = response.status;
            return response;
        });
    }
    output(operation) {
        this.consoles[operation] ??= openspan_1.console.fork({
            namespace: this.locator.namespace,
            component: this.locator.name,
            operation
        });
        return this.consoles[operation];
    }
}
exports.Aspect = Aspect;
async function invoke(request, options, telemetry) {
    const retry = normalize(options);
    let response;
    for (let attempt = 1; attempt <= retry.attempts; attempt++) {
        telemetry.parentAttributes['retry.attempts'] = attempt;
        try {
            response = await send(request, attempt, telemetry);
        }
        catch (error) {
            await retryError(error, { attempt, options: retry, request });
            continue;
        }
        if (expected(response.status, retry.expected) || attempt === retry.attempts)
            return response;
        const interval = retryAfter(response.headers.get('retry-after')) ?? delay(retry, attempt);
        await discard(response);
        await wait(interval, request.signal);
    }
    return response;
}
async function send(request, attempt, telemetry) {
    const attributes = {
        ...telemetry.parentAttributes,
        'retry.attempt': attempt
    };
    delete attributes['retry.attempts'];
    return await telemetry.output.span({
        name: `attempt ${attempt}`,
        kind: 'client',
        attributes
    }, async () => {
        const response = await globalThis.fetch(request.clone());
        attributes['http.response.status_code'] = response.status;
        return response;
    });
}
async function retryError(error, parameters) {
    const { attempt, options, request } = parameters;
    if (attempt === options.attempts || request.signal.aborted)
        throw error;
    await wait(delay(options, attempt), request.signal);
}
async function discard(response) {
    try {
        await response.body?.cancel();
    }
    catch {
        // The response is discarded regardless of whether its stream closes cleanly.
    }
}
function normalize(options) {
    if (options === undefined)
        return { attempts: 1, expected: undefined, delay: DEFAULT_DELAY, factor: DEFAULT_FACTOR };
    if (!Number.isInteger(options.attempts) || options.attempts < 1)
        throw new TypeError('retry.attempts must be an integer greater than or equal to 1');
    if (options.expected !== undefined &&
        (options.expected.length === 0 || options.expected.some((status) => !Number.isInteger(status) || status < 100 || status > 599)))
        throw new TypeError('retry.expected must contain HTTP status codes');
    if (options.delay !== undefined && (!Number.isFinite(options.delay) || options.delay < 0))
        throw new TypeError('retry.delay must be a non-negative number');
    if (options.factor !== undefined && (!Number.isFinite(options.factor) || options.factor < 0))
        throw new TypeError('retry.factor must be a non-negative number');
    return {
        attempts: options.attempts,
        expected: options.expected,
        delay: options.delay ?? DEFAULT_DELAY,
        factor: options.factor ?? DEFAULT_FACTOR
    };
}
function expected(status, statuses) {
    return statuses === undefined ? status >= 200 && status < 300 : statuses.includes(status);
}
function delay(options, attempt) {
    return options.delay * Math.pow(options.factor, attempt - 1);
}
function retryAfter(value) {
    if (value === null)
        return undefined;
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds >= 0)
        return seconds * 1000;
    const date = Date.parse(value);
    if (Number.isNaN(date))
        return undefined;
    return Math.max(0, date - Date.now());
}
async function wait(milliseconds, signal) {
    if (signal.aborted)
        throw signal.reason;
    await new Promise((resolve, reject) => {
        const timeout = setTimeout(done, milliseconds);
        signal.addEventListener('abort', aborted, { once: true });
        function done() {
            signal.removeEventListener('abort', aborted);
            resolve();
        }
        function aborted() {
            clearTimeout(timeout);
            reject(signal.reason);
        }
    });
}
function requestURL(request) {
    return new URL(request.url);
}
const DEFAULT_DELAY = 100;
const DEFAULT_FACTOR = 2;
//# sourceMappingURL=Aspect.js.map