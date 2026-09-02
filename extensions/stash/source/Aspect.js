"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Aspect = void 0;
/* eslint-disable @typescript-eslint/no-floating-promises */
const msgpackr_1 = require("msgpackr");
const openspan_1 = require("openspan");
const core_1 = require("@toa.io/core");
class Aspect extends core_1.Connector {
    name = 'stash';
    connection;
    redis = null;
    constructor(connection) {
        super();
        this.connection = connection;
        this.depends(connection);
    }
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    invoke(method, ...args) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (typeof this.redis[method] === 'function') {
            // multi/pipeline return a sync chainable; the span wraps exec() instead
            if (method === 'multi' || method === 'pipeline') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                const chain = this.redis[method](...args);
                const exec = chain.exec.bind(chain);
                chain.exec = async () => {
                    const options = span(method, args[0]);
                    Object.assign(options.attributes, { 'db.operation.batch.size': chain.length });
                    return await openspan_1.console.span(options, exec);
                };
                return chain;
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            return openspan_1.console.span(span(method, args[0]), () => this.redis[method](...args));
        }
        if (method === 'store')
            openspan_1.console.span(span(method, args[0]), async () => { await this.store(args[0], args[1], ...args.slice(2)); });
        if (method === 'fetch')
            return openspan_1.console.span(span(method, args[0]), async () => await this.fetch(args[0]));
    }
    async open() {
        this.redis = this.connection.redis;
    }
    async store(key, value, ...args) {
        const buffer = (0, msgpackr_1.encode)(value);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        await this.redis.set(key, buffer, ...args);
    }
    async fetch(key) {
        if (this.redis === null)
            return null;
        const buffer = await this.redis.getBuffer(key);
        return buffer === null ? null : (0, msgpackr_1.decode)(buffer);
    }
}
exports.Aspect = Aspect;
function span(method, key) {
    // https://opentelemetry.io/docs/specs/semconv/database/redis/
    // `db.namespace` names the database node on service graphs,
    // which otherwise displays 'unknown'
    const attributes = {
        'db.system': 'redis',
        'db.namespace': 'stash',
        'db.operation.name': method
    };
    if (typeof key === 'string')
        attributes.key = key;
    else if (Array.isArray(key))
        attributes.key = key.join(' ');
    return { name: `${method} stash`, kind: 'client', attributes };
}
//# sourceMappingURL=Aspect.js.map