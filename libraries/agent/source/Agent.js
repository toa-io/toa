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
exports.Agent = void 0;
const http = __importStar(require("node:http"));
const https = __importStar(require("node:https"));
const assert = __importStar(require("node:assert"));
const consumers_1 = require("node:stream/consumers");
const generic_1 = require("@toa.io/generic");
const undici = __importStar(require("undici"));
const node_1 = require("meros/node");
const protocol = __importStar(require("./index.js"));
const request_js_1 = require("./request.js");
const parser = __importStar(require("./parse/index.js"));
const Captures_js_1 = require("./Captures.js");
/*
It is extracted from the Exposition.
Use its features to test.

/extensions/exposition/features/identity.feature
 */
class Agent {
    origin;
    response = '';
    /** The last response body, as received. A binary body does not survive `response`. */
    bytes = null;
    captures;
    pending = new Set();
    constructor(origin, captures = new Captures_js_1.Captures()) {
        this.origin = origin;
        this.captures = captures;
    }
    async fetch(input, options = {}) {
        const message = this.normalize(input);
        return await (0, request_js_1.request)(message, { ...options, base: this.origin });
    }
    async request(input) {
        const response = await this.fetch(input);
        this.bytes = Buffer.from(await response.body.arrayBuffer());
        this.response = await parser.response(response, this.bytes.toString());
    }
    async parts(input) {
        const message = this.normalize(input);
        const req = (0, request_js_1.parse)(message, this.origin);
        const headers = {};
        for (const [key, value] of req.headers)
            headers[key] = value;
        const protocol = new URL(req.url).protocol === 'https:' ? https : http;
        const response = await new Promise((resolve, reject) => {
            const request = protocol.request(req.url, {
                method: req.method,
                headers
            }, (response) => resolve(response));
            request.on('error', reject);
            request.end(req.body);
        });
        if (response.statusCode !== 200 && response.statusCode !== 201) {
            response.destroy();
            assert.fail(`Request failed with status ${response.statusCode}: ${req.url}`);
        }
        this.pending.add(response);
        response.on('end', () => this.pending.delete(response));
        response.on('error', () => this.pending.delete(response));
        return await (0, node_1.meros)(response);
    }
    abort() {
        for (const response of this.pending)
            response.destroy();
        this.pending.clear();
    }
    responseIncludes(expected) {
        const line = this.mismatch(this.response, expected);
        if (line !== null)
            throw new assert.AssertionError({
                message: `Response is missing '${line}'`,
                expected: line,
                actual: this.response.slice(0, MAX_DIFF_LENGTH)
            });
    }
    mismatch(sample, reference) {
        const lines = (0, generic_1.trim)(reference).split('\n');
        let rest = sample;
        for (const line of lines) {
            if (line.trim() === '')
                continue;
            const match = this.captures.capture(rest, line);
            if (match === null)
                return line;
            rest = rest.slice(match.end);
        }
        return null;
    }
    responseExcludes(expected) {
        const lines = (0, generic_1.trim)(expected).split('\n');
        for (const line of lines) {
            const substituted = this.captures.substitute(line);
            if (this.response.includes(substituted))
                throw new assert.AssertionError({
                    message: `Response contains '${line}'`,
                    expected: line,
                    actual: this.response.slice(0, MAX_DIFF_LENGTH)
                });
        }
    }
    async stream(head, stream) {
        head = (0, generic_1.trim)(head) + '\n\n';
        head = this.captures.substitute(head);
        const { url, method, headers } = protocol.parse.request(head);
        const href = new URL(url, this.origin).href;
        const options = {
            method,
            headers,
            body: stream
        };
        try {
            const response = await undici.request(href, options);
            this.response = await protocol.parse.response(response);
        }
        catch (e) {
            console.error(e);
            console.error(e.cause);
            throw e;
        }
    }
    async streamMatch(head, stream) {
        const buf = await (0, consumers_1.buffer)(stream);
        const text = buf.toString('utf8');
        const expected = head + '\n\n' + text;
        this.responseIncludes(expected);
    }
    normalize(input) {
        const substituted = this.captures.substitute(input);
        let [headers, body] = (0, generic_1.trim)(substituted).split('\n\n');
        // a request that states its own length is testing that length, and appending
        // a second header would make the client reject it before it is ever sent
        if (body !== undefined && !DECLARES_LENGTH.test(headers))
            headers += '\ncontent-length: ' + Buffer.byteLength(body);
        return headers + '\n\n' + (body ?? '');
    }
}
exports.Agent = Agent;
const MAX_DIFF_LENGTH = 4096;
const DECLARES_LENGTH = /^content-length:/im;
//# sourceMappingURL=Agent.js.map