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
exports.Factory = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const node_crypto_1 = require("node:crypto");
const openspan_1 = require("openspan");
const Tenant_js_1 = require("./Tenant.js");
const Gateway_js_1 = require("./Gateway.js");
const Remotes_js_1 = require("./Remotes.js");
const index_js_1 = require("./RTD/index.js");
const Endpoint_js_1 = require("./Endpoint.js");
const index_js_2 = require("./directives/index.js");
const Directive_js_1 = require("./Directive.js");
const Composition_js_1 = require("./Composition.js");
const root = __importStar(require("./root.js"));
const Interception_js_1 = require("./Interception.js");
const http = __importStar(require("./HTTP/index.js"));
class Factory {
    boot;
    constructor(boot) {
        this.boot = boot;
    }
    tenant(locator, node) {
        const broadcast = this.boot.bindings.broadcast(CHANNEL, locator.id);
        const hash = (0, node_crypto_1.createHash)('sha256').update(JSON.stringify(node)).digest('hex');
        // no timestamp: the tenant stamps each announcement with its own start time
        const branch = {
            namespace: locator.namespace,
            component: locator.name,
            isolated: locator.namespace === 'identity',
            node,
            version: hash
        };
        return new Tenant_js_1.Tenant(broadcast, branch);
    }
    service() {
        node_assert_1.default.ok(process.env.TOA_EXPOSITION_PROPERTIES, 'TOA_EXPOSITION_PROPERTIES is undefined');
        configureLogs();
        const options = JSON.parse(process.env.TOA_EXPOSITION_PROPERTIES);
        const broadcast = this.boot.bindings.broadcast(CHANNEL);
        const server = http.Server.create({ ...options });
        const remotes = new Remotes_js_1.Remotes(this.boot);
        const node = root.resolve();
        const methods = new Endpoint_js_1.EndpointsFactory(remotes);
        const directives = new Directive_js_1.DirectivesFactory(index_js_2.families, remotes);
        const interception = new Interception_js_1.Interception(index_js_2.interceptors);
        const tree = new index_js_1.Tree(node, methods, directives);
        const composition = new Composition_js_1.Composition(this.boot);
        const gateway = new Gateway_js_1.Gateway(broadcast, tree, interception);
        gateway.depends(remotes);
        gateway.depends(composition);
        server.attach(gateway.process.bind(gateway));
        server.depends(gateway);
        return server;
    }
}
exports.Factory = Factory;
const CHANNEL = 'exposition';
const LOGS_PREFIX = 'TOA_TELEMETRY_LOGS';
const TRACES_ENV = 'TOA_TELEMETRY_TRACES';
function configureLogs() {
    const globEnv = process.env[LOGS_PREFIX];
    const level = process.env.TOA_DEV === '1' ? 'trace' : 'info';
    const options = globEnv === undefined ? { level } : JSON.parse(globEnv);
    openspan_1.console.configure({ level: options.level ?? level });
    const tracesEnv = process.env[TRACES_ENV];
    (0, openspan_1.traces)(tracesEnv === undefined ? development() : JSON.parse(tracesEnv));
}
/**
 * Tracing is off unless it is configured. The console exporter is a local development
 * mechanism, so it is turned on for `toa dev` and for a boot trace the CLI has already
 * asked for (`runtime/boot/src/span.js`), and nowhere else — a deployment that wants
 * traces annotates `telemetry.traces.exporters`.
 *
 * The gateway boots without the telemetry extension, hence the copy of
 * `extensions/telemetry/source/extension.ts`.
 */
function development() {
    const local = process.env.TOA_DEV === '1' || process.env.TOA_BOOT_TRACE === '1';
    return local ? { exporters: { console: {} } } : {};
}
//# sourceMappingURL=Factory.js.map