"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Storage = void 0;
const node_path_1 = require("node:path");
const node_crypto_1 = require("node:crypto");
const openspan_1 = require("openspan");
const Scanner_js_1 = require("./Scanner.js");
class Storage {
    provider;
    scope;
    constructor(provider, scope) {
        this.provider = provider;
        this.scope = scope;
    }
    options() {
        return this.provider.options;
    }
    async put(path, stream, options) {
        return await openspan_1.console.span(this.span('put', path), async () => {
            const scanner = new Scanner_js_1.Scanner(options);
            const pipe = stream.pipe(scanner).on('error', () => undefined);
            const id = options?.id ?? (0, node_crypto_1.randomUUID)().replace(/-/g, '');
            const location = this.locate(path, id);
            /**
             * Provider can return or throw an error.
             * If thrown error is TYPE_MISMATCH from the Scanner, it should be returned.
             */
            const error = await this.provider.put(location, pipe)
                .catch((error) => {
                if (error === scanner.error)
                    return error;
                else
                    throw error;
            });
            if (error instanceof Error)
                return error;
            const metadata = {
                id,
                size: scanner.size,
                type: scanner.type,
                checksum: scanner.digest(),
                created: new Date().toISOString(),
                attributes: options?.attributes ?? {}
            };
            if (options?.origin !== undefined)
                metadata.attributes.origin = options.origin;
            await this.provider.commit(location, metadata);
            return metadata;
        });
    }
    async get(path, options) {
        return await openspan_1.console.span(this.span('get', (0, node_path_1.dirname)(path)), async () => {
            const location = this.locate(path);
            return await this.provider.get(location, options);
        });
    }
    async head(path) {
        return await openspan_1.console.span(this.span('head', (0, node_path_1.dirname)(path)), async () => {
            const id = (0, node_path_1.basename)(path).split('.')[0];
            const location = this.locate(path);
            const metadata = await this.provider.head(location);
            if (metadata instanceof Error)
                return metadata;
            return {
                id,
                ...metadata
            };
        });
    }
    async delete(path) {
        return await openspan_1.console.span(this.span('delete', (0, node_path_1.dirname)(path)), async () => {
            const location = this.locate(path);
            return await this.provider.delete(location);
        });
    }
    path() {
        return this.provider.root ?? null;
    }
    locate(...rel) {
        return (0, node_path_1.join)(ENTRIES, ...rel);
    }
    span(method, path) {
        return {
            name: `${method} ${this.scope?.name ?? 'storage'}`,
            kind: 'client',
            attributes: {
                ...this.scope === undefined ? {} : { provider: this.scope.provider },
                path
            }
        };
    }
}
exports.Storage = Storage;
const ENTRIES = '/';
//# sourceMappingURL=Storage.js.map