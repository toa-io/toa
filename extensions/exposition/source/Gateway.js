"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gateway = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const promises_1 = require("node:timers/promises");
const openspan_1 = require("openspan");
const core_1 = require("@toa.io/core");
const http = __importStar(require("./HTTP/index.js"));
const exceptions_js_1 = require("./exceptions.js");
const Branch_js_1 = require("./Branch.js");
class Gateway extends core_1.Connector {
    broadcast;
    tree;
    interceptor;
    branches = new Map();
    lastMerge = 0;
    widestGap = 0;
    lastPing = 0;
    stopped = false;
    resolveFirstMerge = null;
    constructor(broadcast, tree, interception) {
        super();
        this.broadcast = broadcast;
        this.tree = tree;
        this.interceptor = interception;
        this.depends(broadcast);
    }
    async process(context) {
        const interception = await context.timing.capture('intercept', this.interceptor.intercept(context));
        if (interception !== null)
            return interception;
        const { node, parameters } = this.match(context);
        if (context.request.method === 'OPTIONS')
            return await this.explain(node, parameters);
        let verb = context.request.method;
        if (!(verb in node.methods) && verb === 'HEAD' && 'GET' in node.methods)
            verb = 'GET';
        if (!(verb in node.methods))
            throw new http.MethodNotAllowed();
        const method = node.methods[verb];
        const interruption = await context.timing.capture('preflight', method.directives.preflight(context, parameters)).catch(exceptions_js_1.rethrow);
        const response = interruption ??
            await context.timing.capture('call', this.call(method, context, parameters));
        await context.timing.capture('settle', method.directives.settle(context, response)).catch(exceptions_js_1.rethrow);
        return response;
    }
    async open() {
        await this.discover();
        openspan_1.console.info('Gateway started');
    }
    /**
     * Both of these reach into components, and a dependency is torn down only once this has
     * returned — where `dispose` runs after every one of them already has. The throttling
     * ticker firing in between calls an endpoint that has just been unbound, and reports the
     * refusal as a failure to reconcile.
     */
    async close() {
        this.stopped = true;
        this.tree.dispose();
    }
    dispose() {
        openspan_1.console.info('Gateway is closed');
    }
    match(context) {
        const match = this.tree.match(context.url.pathname);
        if (match === null) {
            // the route may be missing because an expose has been lost
            this.reping();
            throw new http.NotFound('Route not found');
        }
        if (match.node.forward === null)
            return match;
        const destination = match.node.forward.replace(/\/:([^/]+)/g, (_, name) => {
            const value = match.parameters.find((parameter) => parameter.name === name)?.value;
            node_assert_1.default.ok(value !== undefined, `Forwarded parameter '${name}' not found`);
            return `/${value}`;
        });
        const forward = this.tree.match(destination);
        node_assert_1.default.ok(forward !== null, 'Forwarded route not found');
        return forward;
    }
    async call(method, context, parameters) {
        if (context.url.pathname[context.url.pathname.length - 1] !== '/')
            throw new http.NotFound('Trailing slash is required');
        if (context.encoder === null)
            throw new http.NotAcceptable();
        if (method.endpoint === null)
            throw new http.MethodNotAllowed();
        return await method.endpoint
            .call(context, parameters)
            .catch(exceptions_js_1.rethrow);
    }
    async explain(node, parameters) {
        const body = await node.explain(parameters);
        const allow = [...Object.keys(node.methods)].join(', ');
        const headers = new Headers({ allow });
        return { body, headers };
    }
    async discover() {
        const first = new Promise((resolve) => {
            this.resolveFirstMerge = resolve;
        });
        await this.broadcast.receive('expose', this.merge.bind(this));
        void this.knock();
        await this.settled(first);
    }
    /**
     * A single ping is enough only if every tenant is listening by then, which is
     * not the case while the deployment is still rolling out.
     */
    async knock() {
        for (const delay of KNOCK_DELAYS) {
            if (this.stopped)
                return;
            if (delay > 0)
                await (0, promises_1.setTimeout)(delay, undefined, { ref: false });
            await this.ping();
        }
    }
    async ping() {
        if (this.stopped)
            return;
        this.lastPing = Date.now();
        await this.broadcast.transmit('ping', null)
            .catch((exception) => openspan_1.console.error('Discovery ping failed', { message: exception.message }));
    }
    reping() {
        if (Date.now() - this.lastPing < PING_COOLDOWN)
            return;
        void this.ping();
    }
    async settled(first) {
        const deadline = Date.now() + SETTLE_TIMEOUT;
        const abort = new AbortController();
        // an uncancelled timer keeps the process alive long after the race is won
        await Promise.race([first, (0, promises_1.setTimeout)(SETTLE_TIMEOUT, undefined, { signal: abort.signal })])
            .finally(() => { abort.abort(); })
            .catch(() => { });
        if (this.lastMerge === 0) {
            openspan_1.console.warn('Discovery timed out waiting for the first expose');
            return;
        }
        while (Date.now() - this.lastMerge < this.quiet()) {
            if (Date.now() >= deadline)
                break;
            await (0, promises_1.setTimeout)(SETTLE_POLL);
        }
    }
    /**
     * How long the branches must stay quiet before discovery counts as settled.
     *
     * Every tenant of a local composition answers the first ping at once, so a short window
     * is enough; a rolling deployment brings them up seconds apart, and the window grows with
     * the widest gap seen so far to keep waiting for the ones still starting.
     */
    quiet() {
        const adaptive = this.widestGap * SETTLE_QUIET_FACTOR;
        return Math.min(Math.max(adaptive, SETTLE_QUIET_MIN), SETTLE_QUIET_MAX);
    }
    merge(branch) {
        const id = branch.namespace + '.' + branch.component;
        const attributes = {
            namespace: branch.namespace,
            component: branch.component,
            version: branch.version
        };
        const exposed = this.branches.get(id);
        if (exposed !== undefined)
            switch ((0, Branch_js_1.decide)(exposed, branch)) {
                // rebuilding an identical branch would only tear down its live endpoints
                case 'refresh':
                    this.tree.refresh(exposed.nodes);
                    openspan_1.console.trace('Branch refreshed', attributes);
                    return;
                case 'superseded':
                    openspan_1.console.debug('Branch superseded', {
                        ...attributes,
                        timestamp: branch.timestamp,
                        exposed: exposed.timestamp
                    });
                    return;
            }
        let nodes;
        try {
            nodes = this.tree.merge(branch.node, branch);
        }
        catch (exception) {
            const message = exception instanceof Error ? exception.message : 'Unknown error';
            openspan_1.console.error('Branch merge exception', { message, ...attributes });
            return;
        }
        this.branches.set(id, { version: branch.version, timestamp: branch.timestamp, nodes });
        if (this.lastMerge !== 0)
            this.widestGap = Math.max(this.widestGap, Date.now() - this.lastMerge);
        this.lastMerge = Date.now();
        this.resolveFirstMerge?.();
        this.resolveFirstMerge = null;
        openspan_1.console.info('Branch merged', attributes);
    }
}
exports.Gateway = Gateway;
const SETTLE_QUIET_MIN = 500;
const SETTLE_QUIET_MAX = 10_000;
const SETTLE_QUIET_FACTOR = 2;
const SETTLE_TIMEOUT = 30_000;
const SETTLE_POLL = 50;
const KNOCK_DELAYS = [0, 500, 1000, 1500];
const PING_COOLDOWN = 5_000;
//# sourceMappingURL=Gateway.js.map