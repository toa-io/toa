"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
const ioredis_1 = require("ioredis");
const openspan_1 = require("openspan");
const core_1 = require("@toa.io/core");
const pointer_1 = require("@toa.io/pointer");
const extension_js_1 = require("./extension.js");
class Connection extends core_1.Connector {
    redis = null;
    locator;
    constructor(locator) {
        super();
        this.locator = locator;
    }
    async open() {
        const keyPrefix = `${this.locator.namespace}:${this.locator.name}:`;
        const options = {
            keyPrefix,
            enableReadyCheck: true,
            lazyConnect: true,
            protocol: 3,
            replyMapping: 'resp3'
        };
        this.redis = new ioredis_1.Redis(await this.resolveURL(), options);
        await this.redis.connect();
        openspan_1.console.info('Stash connected to redis', { host: this.redis.options.host });
    }
    async close() {
        this.redis?.disconnect();
        this.redis = null;
        openspan_1.console.info('Stash shutdown complete');
    }
    async resolveURL() {
        if (process.env.TOA_DEV === '1')
            return 'redis://localhost';
        const urls = (0, pointer_1.resolve)(extension_js_1.ID, this.locator.id);
        // several addresses used to be independent masters for the lock manager, which the atom
        // aspect holds now. A cache is one Redis, and the rest have never been read from
        if (urls.length > 1)
            openspan_1.console.warn('Stash takes the first of several addresses', { count: urls.length });
        return urls[0];
    }
}
exports.Connection = Connection;
//# sourceMappingURL=Connection.js.map