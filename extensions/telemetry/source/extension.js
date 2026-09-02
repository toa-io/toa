"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ID = exports.Factory = void 0;
exports.deployment = deployment;
const node_assert_1 = __importDefault(require("node:assert"));
const openspan_1 = require("openspan");
const Logs_js_1 = require("./Logs.js");
const Span_js_1 = require("./Span.js");
const Ready_js_1 = require("./Ready.js");
class Factory {
    logsOptions;
    ready;
    constructor() {
        const globEnv = process.env[LOGS_PREFIX];
        const level = process.env.TOA_DEV === '1' ? 'trace' : 'info';
        this.logsOptions = globEnv === undefined ? { level } : JSON.parse(globEnv);
        this.logsOptions.level ??= level;
        openspan_1.console.configure({ level: this.logsOptions.level });
        const tracesEnv = process.env[TRACES_ENV];
        (0, openspan_1.traces)(tracesEnv === undefined ? development() : JSON.parse(tracesEnv));
        this.ready = Ready_js_1.Ready.create();
    }
    aspect(locator) {
        const logs = this.createLogs(locator);
        const span = new Span_js_1.Span(locator);
        return [logs, span];
    }
    manage(composition) {
        if (this.ready === null)
            return composition;
        const ready = this.ready;
        // the composition manages the probe server lifecycle (listen on connect, close on disconnect)
        composition.depends(ready);
        const connect = composition.connect.bind(composition);
        // readiness is a post-connect phase, not expressible as a dependency
        composition.connect = async () => {
            await connect();
            await ready.complete();
        };
        return composition;
    }
    createLogs(locator) {
        const overEnv = process.env[`${LOGS_PREFIX}_${locator.uppercase}`];
        const override = overEnv !== undefined ? JSON.parse(overEnv) : undefined;
        const { level } = Object.assign({}, this.logsOptions, override);
        return new Logs_js_1.Logs(locator, { level });
    }
}
exports.Factory = Factory;
/**
 * Tracing is off unless it is configured. The console exporter is a local development
 * mechanism, so it is turned on for `toa dev` and for a boot trace the CLI has already
 * asked for (`runtime/boot/src/span.js`), and nowhere else — a deployment that wants
 * traces annotates `telemetry.traces.exporters`.
 *
 * `extensions/exposition/source/Factory.ts` says the same thing for the gateway process,
 * which boots without this extension.
 */
function development() {
    const local = process.env.TOA_DEV === '1' || process.env.TOA_BOOT_TRACE === '1';
    return local ? { exporters: { console: {} } } : {};
}
function deployment(_, annotation) {
    const variables = { global: [] };
    if (annotation?.logs !== undefined)
        addLogsVariables(annotation.logs, variables);
    if (annotation?.traces !== undefined)
        addTracesVariables(annotation.traces, variables);
    const ready = (0, Ready_js_1.normalizeAnnotation)(annotation?.ready);
    if (ready === false) {
        variables.global.push({ name: Ready_js_1.READY_ENV, value: JSON.stringify(false) });
        return { variables, probe: false };
    }
    variables.global.push({ name: Ready_js_1.READY_ENV, value: JSON.stringify(ready) });
    const probe = {
        path: ready.path ?? Ready_js_1.DEFAULT_ANNOTATION.path,
        port: ready.port ?? Ready_js_1.DEFAULT_ANNOTATION.port
    };
    return { variables, probe };
}
function addLogsVariables(annotation, variables) {
    const { level, ...components } = annotation;
    const global = { level };
    if (level !== undefined)
        variables.global.push({ name: LOGS_PREFIX, value: JSON.stringify(global) });
    for (const [id, override] of Object.entries(components)) {
        const [namespace, name] = id.split('.');
        const value = Object.assign({}, global, override);
        variables.global.push({
            name: `${LOGS_PREFIX}_${namespace.toUpperCase()}_${name.toUpperCase()}`,
            value: JSON.stringify(value)
        });
    }
}
function addTracesVariables(annotation, variables) {
    const { sample, rate, exporters } = annotation;
    if (sample !== undefined)
        node_assert_1.default.ok(typeof sample === 'number' && sample >= 0 && sample <= 1, 'telemetry.traces.sample must be a number within [0, 1]');
    if (rate !== undefined)
        node_assert_1.default.ok(typeof rate === 'number' && rate > 0, 'telemetry.traces.rate must be a positive number');
    if (exporters?.otlp !== undefined)
        node_assert_1.default.ok(typeof exporters.otlp.endpoint === 'string', 'telemetry.traces.exporters.otlp.endpoint is required');
    variables.global.push({ name: TRACES_ENV, value: JSON.stringify({ sample, rate, exporters }) });
}
const ENV_PREFIX = 'TOA_TELEMETRY';
const LOGS_PREFIX = ENV_PREFIX + '_LOGS';
const TRACES_ENV = ENV_PREFIX + '_TRACES';
exports.ID = 'telemetry';
//# sourceMappingURL=extension.js.map