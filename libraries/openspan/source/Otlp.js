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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Otlp = void 0;
const http = __importStar(require("node:http"));
const https = __importStar(require("node:https"));
const Console_js_1 = require("./Console.js");
/**
 * Exports spans to an OTLP/HTTP endpoint (JSON encoding).
 *
 * Spans are batched and flushed when the batch is full or on an interval,
 * and on `beforeExit`.
 *
 * The exporter is tolerant to an absent or unavailable endpoint: a request is bounded by
 * a timeout, a failed batch is dropped, and the exporter suspends itself for a cooldown
 * period, dropping spans instead of queueing them. A single warning is logged per outage,
 * so that neither the process lifecycle nor the log is affected by the missing infrastructure.
 */
class Otlp {
    url;
    transport;
    options;
    headers;
    service;
    timeout;
    cooldown;
    queue = [];
    timer = null;
    sending = null;
    suspendedUntil = 0;
    reported = false;
    constructor(options) {
        const url = new URL(options.endpoint.replace(/\/$/, '') + '/v1/traces');
        this.url = url.href;
        this.transport = url.protocol === 'https:' ? https : http;
        this.headers = { 'content-type': 'application/json', ...options.headers };
        this.options = {
            method: 'POST',
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            agent: new this.transport.Agent({ keepAlive: true })
        };
        this.service = options.service ?? process.env.TOA_CONTEXT ?? 'toa';
        this.timeout = options.timeout ?? TIMEOUT;
        this.cooldown = options.cooldown ?? COOLDOWN;
        process.once('beforeExit', () => void this.flush());
    }
    get suspended() {
        return Date.now() < this.suspendedUntil;
    }
    export(span) {
        if (this.suspended)
            return;
        if (this.queue.length >= QUEUE)
            this.queue.shift(); // drop the oldest
        this.queue.push(span);
        if (this.queue.length >= BATCH)
            void this.flush();
        else
            this.timer ??= setTimeout(() => void this.flush(), INTERVAL).unref();
    }
    /**
     * Never rejects and is bounded by a single request timeout: an unavailable endpoint
     * suspends the exporter, dropping whatever is left in the queue.
     */
    async flush() {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.sending ??= this.send().finally(() => (this.sending = null));
        await this.sending;
    }
    async send() {
        while (this.queue.length > 0) {
            if (this.suspended) {
                this.queue = [];
                return;
            }
            await this.post(this.queue.splice(0, BATCH));
        }
    }
    // never rejects, as a rejection would break the `sending` chain and crash the process
    async post(spans) {
        let body;
        try {
            body = JSON.stringify(this.request(spans));
        }
        catch (error) {
            // a malformed span must not disable the exporter
            Console_js_1.console.warn('OTLP span serialization failed', error);
            return;
        }
        try {
            const status = await this.transmit(body);
            if (status >= 200 && status < 300)
                this.resume();
            else
                this.suspend('OTLP export rejected', { status, spans: spans.length });
        }
        catch (error) {
            this.suspend('OTLP export failed', error);
        }
    }
    /**
     * `node:http` rather than `fetch`, as destroying a request releases its socket, while
     * aborting a `fetch` does not: a connection attempt to an unroutable endpoint keeps
     * the process alive until the OS gives up on it, delaying the shutdown.
     */
    async transmit(body) {
        return await new Promise((resolve, reject) => {
            const headers = { ...this.headers, 'content-length': Buffer.byteLength(body) };
            const request = this.transport.request({ ...this.options, headers }, (response) => {
                response.on('error', reject);
                response.on('end', () => resolve(response.statusCode ?? 0));
                response.resume(); // the socket is released once the response is consumed
            });
            const timer = setTimeout(() => request.destroy(new Error('OTLP request timed out')), this.timeout);
            timer.unref();
            request.on('error', reject);
            request.on('close', () => clearTimeout(timer));
            request.end(body);
        });
    }
    suspend(message, attributes) {
        this.queue = [];
        this.suspendedUntil = Date.now() + this.cooldown;
        if (this.reported)
            return;
        this.reported = true;
        Console_js_1.console.warn(`${message}, spans are dropped until the endpoint recovers`, attributes);
    }
    resume() {
        if (!this.reported)
            return;
        this.reported = false;
        Console_js_1.console.info('OTLP export recovered', { endpoint: this.url });
    }
    request(spans) {
        const services = new Map();
        for (const span of spans) {
            const service = span.service ?? this.service;
            const group = services.get(service);
            if (group === undefined)
                services.set(service, [span]);
            else
                group.push(span);
        }
        return {
            resourceSpans: Array.from(services, ([service, spans]) => ({
                resource: {
                    attributes: attributes({ 'service.name': service })
                },
                scopeSpans: [{
                        scope: { name: 'openspan' },
                        spans: spans.map((span) => this.span(span))
                    }]
            }))
        };
    }
    span(span) {
        return {
            traceId: span.traceId,
            spanId: span.spanId,
            ...span.parentId === undefined ? {} : { parentSpanId: span.parentId },
            name: span.name,
            kind: KINDS[span.kind],
            startTimeUnixNano: (BigInt(span.time) * 1000000n).toString(),
            endTimeUnixNano: (BigInt(span.time) * 1000000n +
                BigInt(Math.round(span.duration * 1_000_000))).toString(),
            attributes: attributes({ ...span.scope, ...span.attributes }),
            status: span.status === 'error' ? { code: 2 } : {}
        };
    }
}
exports.Otlp = Otlp;
function attributes(values) {
    return Object.entries(values)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => ({ key, value: attribute(value) }));
}
function attribute(value) {
    switch (typeof value) {
        case 'string': return { stringValue: value };
        case 'boolean': return { boolValue: value };
        case 'number':
            return Number.isInteger(value)
                ? { intValue: value.toString() }
                : { doubleValue: value };
        default: return { stringValue: JSON.stringify(value) };
    }
}
// https://opentelemetry.io/docs/specs/otlp/#otlphttp
const KINDS = {
    internal: 1,
    server: 2,
    client: 3,
    producer: 4,
    consumer: 5
};
const BATCH = 512;
const QUEUE = 2048;
const INTERVAL = 5000;
const TIMEOUT = 5000;
const COOLDOWN = 30000;
//# sourceMappingURL=Otlp.js.map