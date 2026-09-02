"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traces = traces;
const tracing_js_1 = require("./tracing.js");
const exporters_js_1 = require("./exporters.js");
const Otlp_js_1 = require("./Otlp.js");
/**
 * Configures tracing: sampling and span exporters.
 * Replaces the current configuration entirely.
 *
 * When `exporters` is omitted, tracing is off: nothing consumes a span, so none is
 * created. The console exporter is a local development mechanism and is opted into
 * explicitly (`{ exporters: { console: {} } }`); a deployment configures `otlp`.
 */
function traces(options = {}) {
    (0, tracing_js_1.sampling)(options);
    (0, exporters_js_1.exporting)(createExporters(options.exporters));
}
function createExporters(config) {
    if (config === undefined)
        return [];
    const exporters = [];
    if ('console' in config)
        exporters.push(exporters_js_1.consoleExporter);
    if (config.otlp !== undefined)
        exporters.push(new Otlp_js_1.Otlp(config.otlp));
    return exporters;
}
//# sourceMappingURL=traces.js.map