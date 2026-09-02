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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reporter = void 0;
const core_1 = require("@toa.io/core");
const openspan_1 = require("openspan");
const const_js_1 = require("./const.js");
const keys = __importStar(require("./keys.js"));
/**
 * Buffers what a process observes and flushes it into the introspection
 * components.
 *
 * Nothing here is on the critical path. Reaching the explorer is a discovery,
 * which waits as long as it takes, so the collector never holds up a component
 * starting, running or stopping: it buffers until the connection is there, and
 * when it has to choose it gives up on the data rather than on the application.
 */
class Reporter extends core_1.Connector {
    boot;
    options;
    nodes = new Map();
    edges = new Map();
    /** Holds a remote only once it is connected and usable. */
    remotes = {};
    timer = null;
    flushing = null;
    acquiring = false;
    dropped = 0;
    constructor(boot, options) {
        super();
        this.boot = boot;
        this.options = options;
    }
    /** The static description of a component. */
    expose(node) {
        this.nodes.set(keys.node(node.namespace, node.component), node);
        void this.flush();
    }
    /** A call between two components. */
    observe(observed) {
        const id = keys.edge(observed.src, observed.dst);
        const edge = this.edges.get(id);
        if (edge === undefined) {
            /*
             * `source` arrives over the wire, so the number of distinct edges a process
             * can hold has to be bounded regardless of what peers send — and of whether
             * anyone is there to take them.
             */
            if (this.edges.size >= const_js_1.MAX_EDGES) {
                this.dropped++;
                return;
            }
            this.edges.set(id, observed);
        }
        else if (observed.sample !== undefined)
            edge.sample = observed.sample;
        if (this.edges.size >= this.options.threshold)
            void this.flush();
    }
    async open() {
        // deliberately not awaited: the explorer may not be there yet, or at all
        this.acquire();
        this.timer = setInterval(() => void this.flush(), this.options.interval * 1000);
        this.timer.unref();
    }
    async close() {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
        await this.flushing;
        if (!this.ready()) {
            this.discard('the explorer was never reached');
            return;
        }
        // the remotes are still up: dependencies are disconnected after this returns
        await this.dispatch().catch((error) => {
            openspan_1.console.debug('Introspection final flush failed', { message: error.message });
        });
    }
    ready() {
        return const_js_1.NODES in this.remotes && const_js_1.EDGES in this.remotes;
    }
    async flush() {
        // a dispatch in flight keeps observations buffered, they join the next batch
        if (this.flushing !== null)
            return;
        if (this.nodes.size === 0 && this.edges.size === 0)
            return;
        if (!this.ready()) {
            this.acquire();
            if (this.edges.size >= const_js_1.MAX_EDGES)
                this.discard('the explorer is not reachable');
            return;
        }
        this.flushing = this.dispatch()
            .catch((error) => {
            openspan_1.console.debug('Introspection flush failed', { message: error.message });
        })
            .finally(() => {
            this.flushing = null;
        });
        await this.flushing;
    }
    discard(reason) {
        const nodes = this.nodes.size;
        const edges = this.edges.size + this.dropped;
        this.nodes.clear();
        this.edges.clear();
        this.dropped = 0;
        if (nodes === 0 && edges === 0)
            return;
        openspan_1.console.warn(`Introspection data discarded, ${reason}`, { nodes, edges });
    }
    async dispatch() {
        const nodes = [...this.nodes.entries()];
        const edges = [...this.edges.entries()];
        this.nodes.clear();
        this.edges.clear();
        if (this.dropped > 0) {
            openspan_1.console.warn('Introspection edges dropped', { dropped: this.dropped, limit: const_js_1.MAX_EDGES });
            this.dropped = 0;
        }
        await Promise.all([
            this.merge(const_js_1.NODES, 'nodes', nodes),
            this.merge(const_js_1.EDGES, 'edges', edges)
        ]);
    }
    /**
     * A mass transition: every affected object is acquired and committed at once,
     * so a flush is one call per component whatever it carries.
     */
    async merge(name, property, observed) {
        if (observed.length === 0)
            return;
        const objects = {};
        for (const [id, object] of observed)
            objects[id] = object;
        await this.remotes[name].invoke('merge', {
            query: { ids: observed.map(([id]) => id) },
            input: { [property]: objects },
            task: true
        });
    }
    /** Runs in the background: discovery waits for the explorer as long as it takes. */
    acquire() {
        if (this.acquiring)
            return;
        this.acquiring = true;
        void this.reach().catch((error) => {
            this.acquiring = false;
            openspan_1.console.error('Introspection cannot reach its explorer', { message: error.message });
        });
    }
    async reach() {
        await Promise.all([const_js_1.NODES, const_js_1.EDGES].map(async (name) => {
            const remote = await this.boot.remote(new core_1.Locator(name, const_js_1.NAMESPACE));
            this.depends(remote);
            await remote.connect();
            this.remotes[name] = remote;
        }));
    }
}
exports.Reporter = Reporter;
//# sourceMappingURL=Reporter.js.map