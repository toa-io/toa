"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleExporter = void 0;
exports.exporting = exporting;
exports.exporters = exporters;
exports.recording = recording;
exports.flush = flush;
const state_js_1 = require("./state.js");
/**
 * Writes spans as TRACE log entries using the emitting console, respecting its log level.
 *
 * Rendering a span as a line belongs here rather than on the console: a console writes
 * messages, and a span is not one. What it borrows is the writer — the level, the context and
 * the streams of whichever console emitted the span.
 */
exports.consoleExporter = {
    export(span, output) {
        const entry = {
            attributes: span.attributes,
            trace_id: span.traceId,
            span_id: span.spanId,
            duration: span.duration
        };
        if (span.parentId !== undefined)
            entry.parent_id = span.parentId;
        if (span.kind !== 'internal')
            entry.kind = span.kind;
        if (span.status !== undefined)
            entry.status = span.status;
        output.entry('trace', span.name, entry);
    }
};
/**
 * Replaces the set of span exporters entirely.
 * Defaults to none: tracing is off until an exporter is configured.
 */
function exporting(exporters) {
    state_js_1.state.exporters = exporters;
}
function exporters() {
    return state_js_1.state.exporters ?? NONE;
}
/**
 * Whether anything at all consumes spans. When nothing does, traces are not
 * sampled and spans are not created — see `decide()`.
 */
function recording() {
    return exporters().length > 0;
}
const NONE = [];
/**
 * Flushes all exporters, e.g. before `process.exit()`,
 * which does not emit `beforeExit`.
 */
async function flush() {
    await Promise.all(exporters().map(async (exporter) => exporter.flush?.()));
}
//# sourceMappingURL=exporters.js.map