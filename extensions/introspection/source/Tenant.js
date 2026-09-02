"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tenant = void 0;
const promises_1 = require("node:timers/promises");
const core_1 = require("@toa.io/core");
const const_js_1 = require("./const.js");
/**
 * Announces the static description of a component.
 *
 * Delivery is guaranteed, so the repeat is not about reliability — it keeps
 * `_updated` fresh, which is how a removed component fades off the map.
 */
class Tenant extends core_1.Connector {
    reporter;
    node;
    stopped = false;
    constructor(reporter, node) {
        super();
        this.reporter = reporter;
        this.node = node;
        this.depends(reporter);
    }
    async open() {
        this.reporter.expose(this.node);
        void this.announce();
    }
    dispose() {
        this.stopped = true;
    }
    async announce() {
        while (!this.stopped) {
            await (0, promises_1.setTimeout)(const_js_1.ANNOUNCE_INTERVAL, undefined, { ref: false });
            if (this.stopped)
                break;
            this.reporter.expose(this.node);
        }
    }
}
exports.Tenant = Tenant;
//# sourceMappingURL=Tenant.js.map