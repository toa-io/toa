"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.console = exports.LEVELS = exports.Console = void 0;
exports.record = record;
const tracing_js_1 = require("./tracing.js");
const exporters_js_1 = require("./exporters.js");
class Console {
    trace = this.channel('trace');
    debug = this.channel('debug');
    log = this.debug;
    info = this.channel('info');
    warn = this.channel('warn');
    error = this.channel('error');
    level = exports.LEVELS.trace;
    stdout = process.stdout;
    stderr = process.stderr;
    context;
    constructor(options = {}) {
        this.configure(options);
    }
    configure(options = {}) {
        if (options.level !== undefined)
            this.level = typeof options.level === 'string' ? exports.LEVELS[options.level] : options.level;
        if (options.streams !== undefined) {
            this.stdout = options.streams.stdout;
            this.stderr = options.streams.stderr;
        }
        if (options.context !== undefined)
            this.context = options.context;
    }
    async span(naming, arg, task) {
        if (typeof arg === 'function')
            task = arg;
        const parent = (0, tracing_js_1.current)();
        /*
         * An unsampled trace records nothing, and the context a child would inherit is the
         * one already in scope — so there is nothing to create and nothing to propagate.
         * The decision itself is made once, when the trace root is opened below.
         */
        if (parent !== undefined && !parent.sampled)
            return await task();
        const options = typeof naming === 'string' ? { name: naming } : naming;
        if (typeof arg !== 'function')
            options.attributes = arg;
        const context = (0, tracing_js_1.create)(parent);
        if (options.service !== undefined)
            context.service = options.service;
        const time = Date.now();
        const start = performance.now();
        try {
            const result = await (0, tracing_js_1.run)(context, task);
            this.complete(context, options, time, start);
            return result;
        }
        catch (error) {
            this.complete(context, options, time, start, error);
            throw error;
        }
    }
    /**
     * Writes an entry carrying fields a message alone cannot: a span rendered as a log line,
     * for instance. The channels above are the ordinary way in; this is for whoever composes
     * an entry of their own, which today is the console span exporter.
     */
    entry(channel, message, rest = {}) {
        const level = exports.LEVELS[channel];
        if (level < this.level)
            return;
        const { attributes, ...fields } = rest;
        this.write(level, channel.toUpperCase(), message, attributes, fields);
    }
    fork(ctx) {
        const options = {
            level: this.level,
            streams: {
                stdout: this.stdout,
                stderr: this.stderr
            }
        };
        const context = this.context === undefined ? ctx : { ...this.context, ...ctx };
        if (context !== undefined)
            options.context = context;
        return new Console(options);
    }
    channel(channel) {
        const level = exports.LEVELS[channel];
        const severity = channel.toUpperCase();
        return (message, attributes) => {
            if (level < this.level)
                return;
            this.write(level, severity, message, attributes);
        };
    }
    // eslint-disable-next-line max-params
    complete(context, options, time, start, error) {
        if (!context.sampled)
            return;
        const span = {
            name: options.name,
            traceId: context.traceId,
            spanId: context.spanId,
            kind: options.kind ?? 'internal',
            time,
            duration: Math.round((performance.now() - start) * 1000) / 1000
        };
        if (context.parentId !== undefined)
            span.parentId = context.parentId;
        if (options.attributes !== undefined)
            span.attributes = options.attributes;
        if (this.context !== undefined)
            span.scope = this.context;
        if (context.service !== undefined)
            span.service = context.service;
        if (error !== undefined || context.status === 'error')
            span.status = 'error';
        for (const exporter of (0, exporters_js_1.exporters)())
            exporter.export(span, this);
    }
    // eslint-disable-next-line max-params
    write(level, severity, message, attributes, span) {
        const entry = {
            severity,
            message,
            time: new Date().toISOString()
        };
        if (attributes instanceof Error)
            entry.attributes = serialize(attributes);
        else if (attributes !== undefined)
            entry.attributes = attributes;
        if (this.context !== undefined)
            entry.context = this.context;
        const context = (0, tracing_js_1.current)();
        if (context !== undefined) {
            entry.trace_id = context.traceId;
            entry.span_id = context.spanId;
        }
        if (span !== undefined)
            Object.assign(entry, span);
        const buffer = Buffer.from(JSON.stringify(entry) + '\n');
        if (level === exports.LEVELS.error)
            this.stderr.write(buffer);
        else
            this.stdout.write(buffer);
    }
}
exports.Console = Console;
function serialize(error) {
    const attributes = { message: error.message };
    // @ts-expect-error -- custom error classes
    if (error.code !== undefined)
        // @ts-expect-error -- custom error classes
        attributes.code = error.code;
    if (error.stack !== undefined)
        attributes.stack = error.stack;
    if (error.cause !== undefined)
        attributes.cause = error.cause instanceof Error ? serialize(error.cause) : error.cause;
    return attributes;
}
exports.LEVELS = {
    trace: -2,
    debug: -1,
    info: 0,
    warn: 1,
    error: 2
};
const KEY = Symbol.for('openspan.console');
/**
 * A process may load several copies of this module (see `state.ts`).
 * The singleton is shared via `globalThis`, so that `configure()`
 * (e.g. the log level set by the telemetry extension) applies to every copy.
 */
exports.console = (globalThis[KEY] ??= new Console());
/**
 * Passes an externally completed span to the exporters.
 * Used for event-based instrumentation (e.g. database drivers),
 * where spans cannot wrap a task.
 */
function record(span, output = exports.console) {
    for (const exporter of (0, exporters_js_1.exporters)())
        exporter.export(span, output);
}
//# sourceMappingURL=Console.js.map