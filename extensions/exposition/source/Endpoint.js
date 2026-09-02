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
exports.EndpointsFactory = exports.Endpoint = void 0;
const node_stream_1 = require("node:stream");
const openspan_1 = require("openspan");
const Mapping_js_1 = require("./Mapping.js");
const http = __importStar(require("./HTTP/index.js"));
class Endpoint {
    endpoint;
    mapping;
    discovery;
    remote = null;
    constructor(endpoint, mapping, discovery) {
        this.endpoint = endpoint;
        this.mapping = mapping;
        this.discovery = discovery;
    }
    async call(context, parameters) {
        const body = await context.body();
        const query = this.query(context);
        const request = this.mapping.fit(body, query, parameters);
        this.remote ??= await this.discovery;
        const endpoint = this.remote.locator.id + '.' + this.endpoint;
        openspan_1.console.debug('Calling operation', { endpoint, request });
        const reply = await this.remote.invoke(this.endpoint, request);
        openspan_1.console.debug('Received reply', { endpoint, reply: reply instanceof node_stream_1.Readable ? '[Readable stream]' : reply });
        if (reply instanceof Error)
            throw new http.UnprocessableEntity(reply);
        const message = {};
        // etag
        if (reply !== null && reply !== undefined) {
            const etag = context.request.headers['if-none-match'];
            if (this.conditionalGet(reply, etag, message))
                return message;
        }
        // last-modified
        if (typeof reply === 'object' && reply !== null && ('_updated' in reply || '_created' in reply)) {
            const timestamp = reply._updated ?? reply._created;
            const date = new Date(timestamp);
            message.headers ??= new Headers();
            message.headers.set('last-modified', date.toUTCString());
        }
        message.body = reply;
        return message;
    }
    async explain(parameters) {
        this.remote ??= await this.discovery;
        const operation = await this.remote.explain(this.endpoint);
        let route = null;
        if (operation.input?.type === 'object')
            for (const parameter of parameters) {
                const schema = operation.input.properties[parameter.name];
                // eslint-disable-next-line max-depth
                if (schema !== undefined) {
                    route ??= {};
                    route[parameter.name] = schema;
                    delete operation.input.properties[parameter.name];
                }
            }
        const query = this.mapping.explain(operation);
        const introspection = {};
        if (route !== null)
            introspection.route = route;
        if (query !== null)
            introspection.query = query;
        Object.assign(introspection, operation);
        return introspection;
    }
    async close() {
        this.remote ??= await this.discovery;
        await this.remote.disconnect(INTERRUPT);
    }
    conditionalGet(reply, etag, message) {
        message.headers ??= new Headers();
        if (typeof reply === 'object' && reply !== null && '_version' in reply) {
            const version = reply._version;
            const matched = etag === undefined ? null : this.matchVersion(etag);
            if (etag !== undefined && matched !== null && version === matched) {
                message.status = 304;
                message.headers.set('etag', etag);
                return true;
            }
            message.headers.set('etag', `"${version.toString()}"`);
            return false;
        }
        if (reply instanceof node_stream_1.Readable)
            return false;
        /*
         * A reply that carries no version is tagged with a hash of its body. The body is
         * serialized anyway when the response is written, so the tag is computed from what
         * is actually sent rather than from a second serialization of the reply — which
         * makes it specific to the negotiated representation, hence `vary: accept`.
         */
        message.etag = true;
        return false;
    }
    query(context) {
        const query = Object.fromEntries(context.url.searchParams);
        const etag = context.request.headers['if-match'];
        if (etag !== undefined && this.mapping.queryable)
            query.version = this.version(etag);
        return query;
    }
    matchVersion(etag) {
        const match = etag.match(ETAG);
        if (match === null)
            return null;
        return Number.parseInt(match.groups.version);
    }
    version(etag) {
        const version = this.matchVersion(etag);
        if (version === null)
            throw new http.BadRequest('Invalid ETag');
        return version;
    }
}
exports.Endpoint = Endpoint;
class EndpointsFactory {
    remotes;
    constructor(remotes) {
        this.remotes = remotes;
    }
    create(method, context) {
        if (method.mapping === undefined)
            throw new Error('Cannot create Endpoint without mapping');
        const mapping = Mapping_js_1.Mapping.create(method.mapping.query);
        const branch = context.extension;
        const namespace = method.mapping.namespace ?? branch?.namespace;
        const component = method.mapping.component ?? branch?.component;
        if (namespace === undefined || component === undefined)
            throw new Error('Annotation endpoints must be fully qualified');
        const discovery = this.remotes.discover(namespace, component, branch?.version);
        return new Endpoint(method.mapping.endpoint, mapping, discovery);
    }
}
exports.EndpointsFactory = EndpointsFactory;
const ETAG = /^(W\/)?"(?<version>\d{1,32})"$/;
const INTERRUPT = true;
//# sourceMappingURL=Endpoint.js.map