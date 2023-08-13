"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
const ioredis_1 = require("ioredis");
const core_1 = require("@toa.io/core");
const pointer_1 = require("@toa.io/pointer");
const extension_1 = require("./extension");
class Connection extends core_1.Connector {
    redises = [];
    locator;
    constructor(locator) {
        super();
        this.locator = locator;
    }
    async open() {
        const keyPrefix = `${this.locator.namespace}:${this.locator.name}:`;
        const options = { keyPrefix, enableReadyCheck: true, lazyConnect: true };
        const urls = await this.resolveURLs();
        for (const url of urls)
            this.redises.push(new ioredis_1.Redis(url, options));
        const connecting = this.redises.map(this.connectNode.bind(this));
        await Promise.all(connecting);
    }
    async close() {
        for (const redis of this.redises)
            redis.disconnect();
        console.log('Stash disconnected');
    }
    async connectNode(redis) {
        await redis.connect();
        console.log(`Stash connected to ${redis.options.host}:${String(redis.options.port)}`);
    }
    async resolveURLs() {
        if (process.env.TOA_DEV === '1')
            return ['redis://localhost'];
        else
            return await (0, pointer_1.resolve)(extension_1.ID, this.locator.id);
    }
}
exports.Connection = Connection;
//# sourceMappingURL=Connection.js.map