"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tenant = void 0;
const promises_1 = require("node:timers/promises");
const core_1 = require("@toa.io/core");
const const_js_1 = require("./const.js");
class Tenant extends core_1.Connector {
    broadcast;
    branch;
    started = 0;
    stopped = false;
    constructor(broadcast, branch) {
        super();
        this.broadcast = broadcast;
        this.branch = branch;
        this.depends(broadcast);
    }
    async open() {
        this.started = Date.now();
        await this.expose();
        await this.broadcast.receive('ping', this.expose.bind(this));
        void this.announce();
    }
    /**
     * Announcing is stopped where the teardown begins, not in `dispose`, which a connector
     * runs after every one of its dependencies has gone. A component on its way out that
     * announces itself once more has its routes held open by whoever is listening, and the
     * requests that follow reach nothing.
     */
    async close() {
        this.stopped = true;
    }
    async announce() {
        while (!this.stopped) {
            const delay = exposeInterval(Date.now() - this.started);
            await (0, promises_1.setTimeout)(delay, undefined, { ref: false });
            if (this.stopped)
                break;
            await this.expose();
        }
    }
    async expose() {
        // the ping subscription outlives the announcing loop, and answering one on the way out
        // is the same announcement by another route
        if (this.stopped)
            return;
        await this.broadcast.transmit('expose', { ...this.branch, timestamp: this.started });
    }
}
exports.Tenant = Tenant;
function exposeInterval(uptime) {
    return Math.round(EXPOSE_MAX - (EXPOSE_MAX - EXPOSE_MIN) * Math.exp(-uptime / EXPOSE_TAU));
}
const EXPOSE_MIN = 5_000;
const EXPOSE_MAX = Math.round(const_js_1.BRANCH_TTL / 2.1);
const EXPOSE_TAU = 900_000;
//# sourceMappingURL=Tenant.js.map