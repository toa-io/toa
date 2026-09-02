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
exports.Get = void 0;
const index_js_1 = require("../../HTTP/index.js");
const schemas = __importStar(require("./schemas.js"));
const Directive_js_1 = require("./Directive.js");
class Get extends Directive_js_1.Directive {
    targeted = true;
    options = {
        meta: false
    };
    discovery;
    storage;
    constructor(options, discovery) {
        super();
        schemas.get.validate(options);
        Object.assign(this.options, options);
        this.discovery = discovery;
    }
    async apply(storage, input) {
        this.storage ??= await this.discovery;
        if (input.subtype === 'octets.entry')
            if (this.options.meta)
                return this.head(storage, input);
            else
                throw new index_js_1.Forbidden('Metadata is not accessible');
        else
            return await this.get(storage, input);
    }
    async get(storage, input) {
        if ('if-none-match' in input.request.headers)
            return { status: 304 };
        const endpoint = input.request.method === 'GET' ? 'get' : 'head';
        const entry = await this.storage.invoke(endpoint, {
            input: {
                storage,
                path: input.request.url,
                range: input.request.headers.range,
                agent: input.request.headers['user-agent']
            }
        });
        if (entry instanceof Error)
            throw new index_js_1.NotFound();
        const headers = new Headers({
            'content-type': entry.type,
            etag: `"${entry.checksum}"`
        });
        if (entry.range !== undefined)
            headers.set('content-range', entry.range);
        if (entry.size === null)
            headers.set('transfer-encoding', 'chunked');
        else
            headers.set('content-length', entry.size.toString());
        return {
            status: entry.partial === true ? 206 : 200,
            headers,
            body: endpoint === 'get' ? entry.stream : undefined
        };
    }
    async head(storage, input) {
        const entry = await this.storage.invoke('head', {
            input: {
                storage,
                path: input.request.url
            }
        });
        if (entry instanceof Error)
            throw new index_js_1.NotFound();
        return { body: entry };
    }
}
exports.Get = Get;
//# sourceMappingURL=Get.js.map