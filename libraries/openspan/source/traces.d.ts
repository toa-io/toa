import type { OtlpOptions } from './Otlp.js';
import type { SamplingOptions } from './tracing.js';
/**
 * Configures tracing: sampling and span exporters.
 * Replaces the current configuration entirely.
 *
 * When `exporters` is omitted, tracing is off: nothing consumes a span, so none is
 * created. The console exporter is a local development mechanism and is opted into
 * explicitly (`{ exporters: { console: {} } }`); a deployment configures `otlp`.
 */
export declare function traces(options?: TracesOptions): void;
export interface TracesOptions extends SamplingOptions {
    exporters?: ExportersConfig;
}
export interface ExportersConfig {
    console?: unknown;
    otlp?: OtlpOptions;
}
