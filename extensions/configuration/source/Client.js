"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const openspan_1 = require("openspan");
const core_1 = require("@toa.io/core");
const const_js_1 = require("./const.js");
/**
 * One per process: one remote to the values service and one subscription to its events,
 * shared by every Aspect. What the Aspects ask for is collected and sent as one call;
 * what the service creates afterwards is handed to whoever subscribed.
 */
class Client extends core_1.Connector {
    /** Disconnected once, a connector keeps what it depended on, so a gone client is not reused. */
    disposed = false;
    boot;
    options;
    pending = new Map();
    listeners = new Map();
    remote = null;
    timer = null;
    flushing = false;
    fresh = false;
    round = 0;
    constructor(boot, options = {}) {
        super();
        this.boot = boot;
        this.options = { ...DEFAULTS, ...options };
    }
    /** The configuration of a component for an epoch, once the service has one. */
    async fetch(component, epoch) {
        const key = id(component, epoch);
        let entry = this.pending.get(key);
        if (entry === undefined) {
            entry = { component, epoch, waiters: [] };
            this.pending.set(key, entry);
        }
        const promise = new Promise((resolve) => {
            entry.waiters.push(resolve);
        });
        if (this.flushing)
            this.fresh = true;
        else
            this.schedule(0);
        return await promise;
    }
    subscribe(component, epoch, listener) {
        const key = id(component, epoch);
        if (!this.listeners.has(key))
            this.listeners.set(key, new Set());
        this.listeners.get(key).add(listener);
    }
    unsubscribe(component, epoch, listener) {
        this.listeners.get(id(component, epoch))?.delete(listener);
    }
    async open() {
        this.remote = await this.boot.remote(LOCATOR, const_js_1.SOURCE);
        this.depends(this.remote);
        await this.remote.connect();
        const subscription = new Subscription(this.deliver.bind(this));
        const consumer = await this.boot.receive(const_js_1.EVENT, subscription);
        this.depends(consumer);
        await consumer.connect();
    }
    async close() {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    async dispose() {
        this.disposed = true;
    }
    schedule(delay) {
        if (this.flushing)
            return;
        if (this.timer !== null) {
            // a request that has just arrived does not wait for the round already planned
            if (delay > 0)
                return;
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            void this.flush();
        }, delay);
    }
    async flush() {
        this.timer = null;
        this.flushing = true;
        this.fresh = false;
        const batch = [...this.pending.values()];
        const input = batch.map(({ component, epoch }) => ({ component, epoch }));
        try {
            const output = await this.remote.invoke('fetch', { input });
            if (output instanceof Error)
                throw output;
            this.settle(output);
        }
        catch (error) {
            openspan_1.console.warn('Configuration fetch failed', { error });
        }
        finally {
            this.flushing = false;
        }
        this.report(batch);
        if (this.pending.size === 0)
            return;
        if (this.fresh)
            this.schedule(0);
        else
            this.schedule(this.backoff());
    }
    /** Those the service has served are told; the rest stay for the next round. */
    settle(output) {
        for (const { component, epoch, configuration, created } of output) {
            if (configuration === null)
                continue;
            const key = id(component, epoch);
            const entry = this.pending.get(key);
            if (entry === undefined)
                continue;
            this.pending.delete(key);
            for (const resolve of entry.waiters)
                resolve({ configuration, created });
        }
    }
    report(batch) {
        const waiting = batch
            .filter(({ component, epoch }) => this.pending.has(id(component, epoch)))
            .map(({ component }) => component);
        if (waiting.length === 0) {
            this.round = 0;
            return;
        }
        this.round++;
        if (this.round % this.options.warn === 1)
            openspan_1.console.warn('Waiting for configuration', { components: waiting, round: this.round });
    }
    backoff() {
        return Math.min(this.options.base * Math.pow(FACTOR, this.round), this.options.max);
    }
    /** A created object goes to the subscribers of its component and epoch, as it is. */
    deliver(created) {
        const listeners = this.listeners.get(id(created.component, created.epoch));
        if (listeners === undefined)
            return;
        const value = { configuration: created.configuration, created: created._created };
        for (const listener of listeners)
            listener(value);
    }
}
exports.Client = Client;
/** What the event consumer hands deliveries to. */
class Subscription extends core_1.Connector {
    handler;
    constructor(handler) {
        super();
        this.handler = handler;
    }
    async receive(message) {
        this.handler(message.payload);
    }
}
function id(component, epoch) {
    return component + '\0' + epoch;
}
const LOCATOR = new core_1.Locator('values', 'configuration');
const FACTOR = 1.5;
const DEFAULTS = {
    base: 1000,
    max: 10000,
    warn: 5
};
//# sourceMappingURL=Client.js.map