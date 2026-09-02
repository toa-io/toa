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
exports.DEFAULT_ANNOTATION = exports.READY_ENV = exports.Ready = void 0;
exports.resolveOptions = resolveOptions;
exports.normalizeAnnotation = normalizeAnnotation;
const http = __importStar(require("node:http"));
const openspan_1 = require("openspan");
const core_1 = require("@toa.io/core");
class Ready extends core_1.Connector {
    name = 'ready';
    server = http.createServer();
    options;
    ready = false;
    startedAt = 0;
    listening = false;
    skipped = false;
    constructor(options) {
        super();
        this.options = options;
        this.server.on('request', (req, res) => this.#listener(req, res));
    }
    static create() {
        const options = resolveOptions();
        if (options === null)
            return null;
        return new Ready(options);
    }
    async listen() {
        if (this.listening || this.skipped)
            return;
        this.startedAt = Date.now();
        try {
            await new Promise((resolve, reject) => {
                const onError = (error) => {
                    this.server.off('listening', onListening);
                    reject(error);
                };
                const onListening = () => {
                    this.server.off('error', onError);
                    resolve();
                };
                this.server.once('error', onError);
                this.server.once('listening', onListening);
                this.server.listen(this.options.port);
            });
        }
        catch (error) {
            // Local multi-process (pm2 + features) shares a host; k8s pods do not.
            if (error?.code === 'EADDRINUSE') {
                this.skipped = true;
                openspan_1.console.warn('Ready probe port already in use, skipping', { port: this.options.port });
                return;
            }
            throw error;
        }
        this.listening = true;
        // a readiness probe answers while the process runs; it must never be the reason it keeps running
        this.server.unref();
    }
    async complete() {
        await this.listen();
        this.ready = true;
        openspan_1.console.info('Ready');
        // the IPC signal is not tied to the probe: a process that gave up the shared port
        // is still ready, and pm2 `wait_ready` would otherwise block until `listen_timeout`
        process.send?.('ready');
    }
    async open() {
        await this.listen();
    }
    async close() {
        this.ready = false;
        if (!this.listening)
            return;
        this.listening = false;
        // keep-alive connections would otherwise hold the server handle, delaying the exit
        this.server.closeAllConnections();
        await new Promise((resolve) => this.server.close(() => resolve()));
    }
    #listener(request, response) {
        if (request.url !== this.options.path) {
            response.writeHead(404).end();
            return;
        }
        if (this.ready)
            response.writeHead(200, { 'cache-control': 'no-store' }).end();
        else {
            const remaining = Math.ceil((Date.now() - this.startedAt) / 1000).toString();
            response.writeHead(503, { 'retry-after': remaining }).end();
        }
    }
}
exports.Ready = Ready;
function resolveOptions() {
    const env = process.env[exports.READY_ENV];
    if (env === undefined)
        return { ...DEFAULTS };
    const decoded = JSON.parse(env);
    if (decoded === false || decoded.enabled === false)
        return null;
    return {
        path: decoded.path ?? DEFAULTS.path,
        port: decoded.port ?? DEFAULTS.port
    };
}
function normalizeAnnotation(ready) {
    if (ready === false)
        return false;
    if (ready === undefined)
        return { enabled: true, ...exports.DEFAULT_ANNOTATION };
    return {
        enabled: true,
        path: ready.path ?? exports.DEFAULT_ANNOTATION.path,
        port: ready.port ?? exports.DEFAULT_ANNOTATION.port
    };
}
exports.READY_ENV = 'TOA_TELEMETRY_READY';
exports.DEFAULT_ANNOTATION = {
    path: '/.ready',
    port: 8001
};
const DEFAULTS = { ...exports.DEFAULT_ANNOTATION };
//# sourceMappingURL=Ready.js.map