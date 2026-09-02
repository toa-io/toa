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
exports.DRAIN = exports.DELAY = exports.PORT = exports.Server = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const http = __importStar(require("node:http"));
const node_events_1 = require("node:events");
const promises_1 = require("node:timers/promises");
const openspan_1 = require("openspan");
const core_1 = require("@toa.io/core");
const messages_js_1 = require("./messages.js");
const exceptions_js_1 = require("./exceptions.js");
const Context_js_1 = require("./Context.js");
class Server extends core_1.Connector {
    server = http.createServer();
    properties;
    authorities;
    process;
    ready = false;
    startedAt = 0;
    constructor(properties) {
        super();
        this.properties = properties;
        this.authorities = Object.fromEntries(Object.entries(properties.authorities).map(([key, value]) => [value, key]));
        this.server.on('request', (req, res) => this.listener(req, res));
        this.server.on('clientError', (error, socket) => {
            openspan_1.console.warn('Client connection error', error);
            if (socket.writable)
                socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            else
                socket.destroy();
        });
    }
    static create(options) {
        const properties = { ...DEFAULTS, ...options };
        return new Server(properties);
    }
    attach(process) {
        this.process = process;
    }
    async open() {
        this.startedAt = Date.now();
        this.server.listen(this.properties.port);
        await (0, node_events_1.once)(this.server, 'listening');
        openspan_1.console.info('HTTP Server is listening');
        this.ready = true;
        openspan_1.console.info('Ready');
        process.send?.('ready');
    }
    async close() {
        this.ready = false;
        this.server.close();
        this.server.closeIdleConnections();
        openspan_1.console.info('Stopped accepting new connections');
        // keep-alive clients hold connections open indefinitely, so the drain is bounded
        await Promise.race([
            (0, node_events_1.once)(this.server, 'close'),
            (0, promises_1.setTimeout)(this.properties.drain, undefined, { ref: false })
        ]);
        this.server.closeAllConnections();
        openspan_1.console.info('Stopped');
    }
    listener(request, response) {
        request.once('error', (error) => {
            openspan_1.console.warn('Request error', errorAttributes(request, error));
            if (!response.writableEnded)
                response.destroy();
        });
        request.socket.once('error', (error) => {
            openspan_1.console.warn('Socket error', errorAttributes(request, error));
            if (!response.writableEnded)
                response.destroy();
        });
        const url = parse(request);
        if (url instanceof Error) {
            openspan_1.console.warn('Invalid request', errorAttributes(request, url));
            response.writeHead(400).end();
            return;
        }
        if (request.method === undefined || !this.properties.methods.has(request.method)) {
            response.writeHead(501).end();
            return;
        }
        if (request.url === '/.ready') {
            if (this.ready)
                response.writeHead(200, { 'cache-control': 'no-store' }).end();
            else {
                const remaining = (Math.ceil((Date.now() - this.startedAt) / 1000)).toString();
                response.writeHead(503, { 'retry-after': remaining }).end();
            }
            return;
        }
        (0, node_assert_1.default)(this.process !== undefined, 'Request processor is not attached');
        const host = request.headers.host;
        const authority = this.authorities[host] ?? host;
        // if the request carries no trace context, the trace starts here
        const remote = trace(request.headers);
        const processing = remote === null
            ? this.serve(request, response, authority, url)
            : (0, openspan_1.run)(remote, async () => await this.serve(request, response, authority, url));
        processing.catch((error) => {
            openspan_1.console.error('Request processing failed', error);
            if (!response.writableEnded)
                response.writeHead(500).end();
        });
    }
    // eslint-disable-next-line max-params
    async serve(request, response, authority, url) {
        await openspan_1.console.span({
            name: `${request.method} ${request.url}`,
            kind: 'server',
            service: 'exposition',
            attributes: { method: request.method, url: request.url, authority }
        }, async () => {
            response.setHeader('ray', (0, openspan_1.current)().traceId);
            const context = new Context_js_1.Context(authority, request, this.properties, url);
            await this.process(context)
                .then(this.success(context, response))
                .catch(this.fail(context, response))
                .finally(() => {
                request.removeAllListeners('error');
                request.socket.removeAllListeners('error');
            });
        });
    }
    success(context, response) {
        return async (message) => {
            let status = message.status;
            if (status === undefined)
                if (message.body === null)
                    status = 404;
                else if (context.request.method === 'POST')
                    status = 201;
                else if (message.body === undefined && context.request.method !== 'HEAD')
                    status = 204;
                else
                    status = 200;
            message.status = status;
            await (0, messages_js_1.write)(context, response, message);
        };
    }
    fail(context, response) {
        return async (exception) => {
            try {
                if (!context.request.complete)
                    await adam(context.request);
                const status = exception instanceof exceptions_js_1.Exception ? exception.status : 500;
                const span = (0, openspan_1.current)();
                // https://opentelemetry.io/docs/specs/semconv/http/http-spans/#status
                if (status >= 500 && span !== undefined)
                    span.status = 'error';
                if (!response.writableEnded) {
                    response.statusCode = status;
                    const message = { status: response.statusCode };
                    // eslint-disable-next-line max-depth
                    if (exception instanceof exceptions_js_1.Exception && exception.headers !== undefined)
                        message.headers = exception.headers;
                    // eslint-disable-next-line max-depth
                    if (context.encoder === null)
                        message.body = undefined;
                    else if (exception instanceof exceptions_js_1.ClientError || this.properties.debug)
                        message.body =
                            exception instanceof exceptions_js_1.Exception
                                ? exception.body
                                : (this.properties.debug && exception.stack) ?? exception.message;
                    await (0, messages_js_1.write)(context, response, message);
                }
            }
            catch (final) {
                openspan_1.console.error('Error in error handler', final);
                if (!response.writableEnded)
                    try {
                        response.writeHead(500).end();
                    }
                    catch (e) {
                        // Nothing more we can do
                    }
            }
        };
    }
}
exports.Server = Server;
/** Parsing the URL is how a request is validated, so the `Context` is handed the result. */
function parse(request) {
    try {
        return new URL(request.url, `https://${request.headers.host}`);
    }
    catch (error) {
        return error;
    }
}
// https://github.com/whatwg/fetch/issues/1254
async function adam(request) {
    const devnull = node_fs_1.default.createWriteStream(node_os_1.default.devNull);
    devnull.on('error', () => undefined);
    request.pipe(devnull).on('error', () => undefined);
    await (0, node_events_1.once)(request, 'end');
}
function errorAttributes(request, error) {
    const attributes = {
        path: request.url,
        method: request.method,
        name: error.name
    };
    if (typeof error.code === 'string')
        attributes.code = error.code;
    if (typeof error.stack === 'string')
        attributes.stack = error.stack;
    return attributes;
}
exports.PORT = 8000;
/**
 * The initial delay of the readiness probe. The server does not sleep for it: whoever
 * probes is the one that waits, and doing it here as well only delayed the process twice.
 */
exports.DELAY = 3; // seconds
exports.DRAIN = 10; // seconds
/**
 * Extracts the remote trace context from the request headers.
 *
 * The `ray` header adopts the trace by ID only and does not bypass sampling:
 * the sampling decision is made by the server.
 */
function trace(headers) {
    if (typeof headers.traceparent === 'string')
        return (0, openspan_1.decode)(headers.traceparent);
    // adopting a trace by ID does not bypass sampling
    if (typeof headers.ray === 'string' && RAY.test(headers.ray) && headers.ray !== ZERO_RAY)
        return { traceId: headers.ray.toLowerCase(), sampled: (0, openspan_1.decide)() };
    return null;
}
const RAY = /^[\da-f]{32}$/i;
const ZERO_RAY = '0'.repeat(32);
const DEFAULTS = {
    methods: new Set(['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'LOCK', 'UNLOCK']),
    debug: false,
    port: exports.PORT,
    drain: exports.DRAIN * 1000
};
/**
 * I'm too fucking dumb to figure out how to handle this in a better way.
 * It can be reproduced by calling `response.destroy()` on the client side while reading
 * an empty stream.
 */
process.on('uncaughtException', (err) => {
    const code = err.code;
    if (code === 'ECONNRESET' || code === 'EPIPE')
        openspan_1.console.warn('Connection reset by peer', code);
    else
        throw err;
});
//# sourceMappingURL=Server.js.map