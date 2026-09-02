"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const consumers_1 = require("node:stream/consumers");
const negotiator_1 = __importDefault(require("negotiator"));
const openspan_1 = require("openspan");
const Timing_js_1 = require("./Timing.js");
const index_js_1 = require("./formats/index.js");
const messages_js_1 = require("./messages.js");
class Context {
    id;
    authority;
    request;
    url;
    subtype = null;
    encoder = null;
    timing;
    debug;
    pipelines = {
        body: [],
        response: []
    };
    consumed = false;
    // eslint-disable-next-line max-params
    constructor(authority, request, properties, url) {
        this.authority = authority;
        this.request = request;
        this.id = node_crypto_1.default.randomUUID();
        // parsed by the server, which had to parse it anyway to know the request is valid
        this.url = url;
        this.timing = new Timing_js_1.Timing();
        this.debug = properties.debug;
        this.log(request);
        const accept = this.request.headers.accept;
        if (accept !== undefined) {
            const match = SUBTYPE.exec(accept);
            if (match !== null) {
                const { type, subtype, suffix } = match.groups;
                this.request.headers.accept = `${type}/${suffix}`;
                this.subtype = subtype;
            }
        }
        const encoder = negotiate(this.request);
        if (encoder !== undefined)
            this.encoder = encoder;
    }
    async buffer() {
        this.consumed = true;
        return await (0, consumers_1.buffer)(this.request);
    }
    async body() {
        let value = this.consumed ? null : await (0, messages_js_1.read)(this);
        for (const transform of this.pipelines.body)
            value = await transform(value);
        return value;
    }
    log(request) {
        const headers = { ...request.headers };
        if (headers.authorization !== undefined)
            // only scheme
            headers.authorization = headers.authorization.slice(0, headers.authorization.indexOf(' '));
        openspan_1.console.debug('Received request', { method: request.method, url: request.url, headers });
    }
}
exports.Context = Context;
/**
 * Negotiation parses the header and sorts the candidates, and the value repeats:
 * clients send one of a handful of `accept` strings. Bounded, the header is theirs.
 */
function negotiate(request) {
    const accept = request.headers.accept ?? '';
    const known = NEGOTIATED.get(accept);
    if (known !== undefined)
        return known === NONE ? undefined : known;
    const mediaType = new negotiator_1.default(request).mediaType(index_js_1.types);
    const encoder = mediaType === undefined ? undefined : index_js_1.formats[mediaType];
    if (NEGOTIATED.size >= NEGOTIATED_LIMIT)
        NEGOTIATED.clear();
    NEGOTIATED.set(accept, encoder ?? NONE);
    return encoder;
}
/** distinguishes "negotiated to nothing" from "not negotiated yet" */
const NONE = Symbol('not acceptable');
const NEGOTIATED = new Map();
const NEGOTIATED_LIMIT = 1024;
const SUBTYPE = /^(?<type>\w{1,32})\/(vnd\.toa\.(?<subtype>\S{1,32})\+)(?<suffix>\S{1,32})$/;
//# sourceMappingURL=Context.js.map