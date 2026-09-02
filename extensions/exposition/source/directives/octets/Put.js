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
exports.Put = void 0;
const node_stream_1 = require("node:stream");
const matchacho_1 = require("matchacho");
const http = __importStar(require("../../HTTP/index.js"));
const index_js_1 = require("../cors/index.js");
const schemas = __importStar(require("./schemas.js"));
const index_js_2 = require("./workflows/index.js");
const Directive_js_1 = require("./Directive.js");
const bytes_js_1 = require("./bytes.js");
class Put extends Directive_js_1.Directive {
    targeted = false;
    location;
    accept;
    limit;
    limitString;
    trust;
    workflow;
    discovery = {};
    storage = null;
    constructor(options, discovery, remotes) {
        super();
        schemas.put.validate(options);
        this.accept = (0, matchacho_1.match)(options?.accept, String, (value) => value, Array, (types) => types.join(','), undefined);
        if (options?.workflow !== undefined)
            this.workflow = new index_js_2.Workflow(options.workflow, remotes);
        if (options?.trust !== undefined)
            this.trust = options.trust.map((value) => value.startsWith('/') ? new RegExp(value.slice(1, -1)) : value);
        if (options?.location !== undefined)
            this.location = options.location;
        this.limitString = options?.limit ?? '64MiB';
        this.limit = (0, bytes_js_1.toBytes)(this.limitString);
        this.discovery.storage = discovery;
        index_js_1.cors.allow('content-attributes');
        index_js_1.cors.allow('content-location');
    }
    async apply(storage, input, parameters) {
        this.storage ??= await this.discovery.storage;
        const request = {
            input: {
                storage,
                request: input.request,
                location: this.location,
                accept: this.accept,
                limit: this.limit,
                trust: this.trust
            }
        };
        const entry = await this.storage.invoke('put', request);
        return (0, matchacho_1.match)(entry, Error, (error) => this.throw(error), () => this.reply(input, storage, entry, parameters));
    }
    // eslint-disable-next-line max-params
    reply(input, storage, entry, parameters) {
        const body = this.workflow === undefined
            ? entry
            : this.execute(input, storage, entry, parameters);
        return { body };
    }
    // eslint-disable-next-line max-params
    execute(input, storage, entry, parameters) {
        const stream = new node_stream_1.PassThrough({ objectMode: true });
        stream.push(entry);
        const location = {
            storage,
            authority: input.authority,
            identity: input.identity?.id,
            path: this.location ?? input.request.url
        };
        this.workflow.execute(location, entry, parameters).pipe(stream);
        return stream;
    }
    throw(error) {
        throw (0, matchacho_1.match)(error.code, 'NOT_ACCEPTABLE', () => new http.UnsupportedMediaType(), 'TYPE_MISMATCH', () => new http.BadRequest(), 'LIMIT_EXCEEDED', () => new http.RequestEntityTooLarge(`Size limit is ${this.limitString}`), 'LOCATION_UNTRUSTED', () => new http.Forbidden(error.message), 'LOCATION_LENGTH', () => new http.BadRequest(error.message), 'LOCATION_UNAVAILABLE', () => new http.NotFound(error.message), 'INVALID_ID', () => new http.BadRequest(error.message), error);
    }
}
exports.Put = Put;
//# sourceMappingURL=Put.js.map