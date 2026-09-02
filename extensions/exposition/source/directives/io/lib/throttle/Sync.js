"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sync = void 0;
const openspan_1 = require("openspan");
/**
 * Reconciles every quota of the process with the other gateways, on one tick.
 *
 * Nothing here is on the request path. Each tick takes what the quotas have spent since
 * the last one and sends all of it as a single call, so the cost of staying in step is
 * one round trip a tick — not one per key, and not one per directive. What comes back is
 * the debt the whole group has reached, which the quotas then decide on locally.
 */
class Sync {
    atom;
    quotas = [];
    remote = null;
    timer = null;
    period = Infinity;
    /** Ticks do not overlap: a slow round trip delays reconciling, it does not double it. */
    reconciling = false;
    constructor(atom) {
        this.atom = atom;
    }
    register(quotas) {
        this.quotas.push(quotas);
        // the shortest interval sets the pace, and reconciling the others more often than
        // they asked for only makes them more accurate — an idle quota contributes nothing
        if (quotas.period < this.period) {
            this.period = quotas.period;
            this.start();
        }
    }
    dispose() {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    start() {
        this.dispose();
        this.timer = setInterval(this.tick, this.period);
        this.timer.unref();
    }
    tick = () => {
        if (this.reconciling)
            return;
        const now = Date.now();
        const batch = [];
        for (const quotas of this.quotas)
            quotas.flush(now, batch);
        if (batch.length === 0)
            return;
        this.reconciling = true;
        void this.reconcile(batch).finally(() => {
            this.reconciling = false;
        });
    };
    async reconcile(batch) {
        try {
            this.remote ??= await this.atom;
            const keys = batch.map((entry) => entry.quotas.name(entry.key));
            const deltas = batch.map((entry) => entry.delta);
            const debts = await this.remote.invoke('meter', { input: { keys, deltas } });
            const now = Date.now();
            for (let i = 0; i < batch.length; i++)
                batch[i].quotas.settled(batch[i], debts[i], now);
        }
        catch (error) {
            // what was not reported stays to be reported by the next tick, and until then
            // this gateway keeps throttling on what it alone has seen, and keeps serving
            openspan_1.console.warn('Throttling could not reconcile with the group', error);
        }
    }
}
exports.Sync = Sync;
//# sourceMappingURL=Sync.js.map