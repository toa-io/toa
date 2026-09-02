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
exports.write = write;
exports.read = read;
exports.multipart = multipart;
const node_stream_1 = require("node:stream");
const node_crypto_1 = require("node:crypto");
const contentType = __importStar(require("content-type"));
const openspan_1 = require("openspan");
const index_js_1 = require("./formats/index.js");
const exceptions_js_1 = require("./exceptions.js");
const server = `Exposition/${require('../../package.json').version}` +
    ((process.env.TOA_CONTEXT === undefined ? '' : ` ${process.env.TOA_CONTEXT}`) +
        (process.env.TOA_ENV === undefined ? '' : `/${process.env.TOA_ENV}`));
const pending = new Map();
async function write(context, response, message) {
    for (const transform of context.pipelines.response)
        await transform(message);
    if (message?.status !== undefined)
        response.statusCode = message.status;
    response.setHeader('server', server);
    message.headers?.forEach((value, key) => response.setHeader(key, value));
    context.timing.append(response);
    if (response.destroyed) {
        openspan_1.console.warn('Request destroyed prematurely', { path: context.url.pathname });
        return;
    }
    response.on('error', (exception) => openspan_1.console.warn('HTTP response error', { path: context.url.pathname, exception }));
    if (message.body instanceof node_stream_1.Readable)
        stream(message, context, response);
    else
        send(message, context, response);
}
async function read(context) {
    const header = context.request.headers['content-type'];
    if (header === undefined)
        return undefined;
    const { type, parameters } = contentType.parse(header);
    if (!(type in index_js_1.formats))
        throw new exceptions_js_1.UnsupportedMediaType();
    const format = index_js_1.formats[type];
    const buf = await context.buffer();
    try {
        return format.decode(buf, parameters.charset);
    }
    catch (error) {
        openspan_1.console.debug('Failed to decode message', {
            path: context.url.pathname,
            error: error?.toString?.()
        });
        throw new exceptions_js_1.BadRequest();
    }
}
function send(message, context, response) {
    if (message.body === undefined || message.body === null) {
        // a HEAD reply carries no body but must still report the length a GET would
        // have returned, so a length already set by a directive is left alone
        if (!response.hasHeader('content-length'))
            response.setHeader('content-length', '0');
        response.end();
        return;
    }
    if (context.encoder === null)
        throw new exceptions_js_1.NotAcceptable();
    const buf = context.encoder.encode(message.body);
    if (message.etag === true && conditional(context, response, buf))
        return;
    response
        .setHeader('content-type', context.encoder.type)
        .setHeader('content-length', buf.length.toString())
        .appendHeader('vary', 'accept')
        .end(buf);
}
/**
 * Tags a reply that carries no version with a hash of the body being sent, and answers
 * `304` when the client already has it. The tag is taken from the encoded body rather
 * than from a serialization of its own, so it identifies the representation — which is
 * what `vary` says.
 */
function conditional(context, response, buf) {
    const etag = `"${(0, node_crypto_1.createHash)('sha256').update(buf).digest('hex')}"`;
    response.setHeader('etag', etag);
    if (context.request.headers['if-none-match'] !== etag)
        return false;
    response
        .setHeader('content-length', '0')
        .appendHeader('vary', 'accept');
    response.statusCode = 304;
    response.end();
    return true;
}
function stream(message, context, response) {
    const encoded = message.headers !== undefined && message.headers.has('content-type');
    if (encoded)
        message.body.pipe(response);
    else
        multipart(message, context, response);
    message.body.on('error', (exception) => {
        openspan_1.console.warn('Message stream error', { path: context.url.pathname, exception });
        response.end();
    });
    if (context.debug)
        debugStream(context, response);
}
function multipart(message, context, response) {
    if (context.encoder === null)
        throw new exceptions_js_1.NotAcceptable();
    const encoder = context.encoder;
    response.setHeader('content-type', `${encoder.multipart}; boundary=${BOUNDARY}`);
    response.write(Buffer.concat([
        CUT,
        CRLF,
        encoder.encode('ACK'),
        CRLF,
        CUT
    ]));
    message.body
        .map((part) => Buffer.concat([
        CRLF /* indicates no boundary headers */,
        encoder.encode(part),
        CRLF,
        CUT
    ]))
        .on('end', () => response.end(Buffer.concat([
        CRLF,
        encoder.encode('FIN'),
        CRLF,
        FINALCUT
    ])))
        .pipe(response);
}
const BOUNDARY = 'cut';
const CUT = Buffer.from(`--${BOUNDARY}\r\n`);
const CRLF = Buffer.from('\r\n');
const FINALCUT = Buffer.from(`--${BOUNDARY}--`);
const PENDING_DEBUG_INTERVAL = 30000;
let pendingInterval = null;
function debugStream(context, response) {
    const ctx = { method: context.request.method, path: context.url.pathname };
    openspan_1.console.debug('Stream opened', ctx);
    pending.set(context.id, ctx);
    response.on('close', () => {
        openspan_1.console.debug('Stream closed', ctx);
        pending.delete(context.id);
        if (pending.size === 0) {
            if (pendingInterval !== null)
                clearInterval(pendingInterval);
            pendingInterval = null;
        }
    });
    if (pendingInterval === null)
        pendingInterval = setInterval(() => openspan_1.console.debug('Pending streams', { size: pending.size }), PENDING_DEBUG_INTERVAL);
}
//# sourceMappingURL=messages.js.map