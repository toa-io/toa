"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Remotes = void 0;
const core_1 = require("@toa.io/core");
class Remotes extends core_1.Connector {
    boot;
    cache = {};
    constructor(boot) {
        super();
        this.boot = boot;
    }
    async discover(namespace, name, version = 'local') {
        const locator = new core_1.Locator(name, namespace);
        const key = locator.id + ':' + version;
        this.cache[key] ??= this.locate(locator);
        return this.cache[key];
    }
    async locate(locator) {
        // the gateway is the origin of every call it forwards
        const remote = await this.boot.remote(locator, SOURCE);
        this.depends(remote);
        await remote.connect();
        return remote;
    }
}
exports.Remotes = Remotes;
const SOURCE = { service: 'exposition' };
//# sourceMappingURL=Remotes.js.map