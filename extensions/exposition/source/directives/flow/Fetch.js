"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fetch = void 0;
const node_stream_1 = require("node:stream");
const node_assert_1 = __importDefault(require("node:assert"));
const matchacho_1 = require("matchacho");
const index_js_1 = require("../../HTTP/index.js");
class Fetch {
    connecting;
    remote = null;
    operation;
    constructor(endpoint, discovery) {
        node_assert_1.default.equal(typeof endpoint, 'string', '`flow:fetch` must be a string');
        const [operation, name, namespace = 'default'] = endpoint.split('.').reverse();
        this.operation = operation;
        this.connecting = discovery.discover(namespace, name);
    }
    async apply(input, parameters) {
        if ('if-none-match' in input.request.headers)
            return { status: 304 };
        this.remote ??= await this.connecting;
        const request = await this.remote.invoke(this.operation, {
            input: {
                authority: input.authority,
                path: input.request.url,
                parameters: Object.fromEntries(parameters.map(({ name, value }) => [name, value]))
            }
        });
        if (request instanceof Error)
            throw new index_js_1.NotFound(request);
        const { url, options } = (0, matchacho_1.match)(request, String, { url: request }, (request) => ({
            url: request.url,
            options: {
                method: request.options?.method ?? 'GET',
                body: request.options?.body,
                headers: request.options?.headers
            }
        }));
        const response = await fetch(url, options);
        if (!response.ok)
            throw new index_js_1.NotFound();
        const headers = new Headers();
        for (const header of ['content-type', 'content-length', 'etag']) {
            const value = response.headers.get(header);
            if (value !== null)
                headers.set(header, value);
        }
        return {
            headers,
            body: response.body === null ? null : node_stream_1.Readable.fromWeb(response.body)
        };
    }
}
exports.Fetch = Fetch;
//# sourceMappingURL=Fetch.js.map