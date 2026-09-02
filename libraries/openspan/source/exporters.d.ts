import type { Console, Kind } from './Console.js';
/**
 * Writes spans as TRACE log entries using the emitting console, respecting its log level.
 *
 * Rendering a span as a line belongs here rather than on the console: a console writes
 * messages, and a span is not one. What it borrows is the writer — the level, the context and
 * the streams of whichever console emitted the span.
 */
export declare const consoleExporter: Exporter;
/**
 * Replaces the set of span exporters entirely.
 * Defaults to none: tracing is off until an exporter is configured.
 */
export declare function exporting(exporters: Exporter[]): void;
export declare function exporters(): Exporter[];
/**
 * Whether anything at all consumes spans. When nothing does, traces are not
 * sampled and spans are not created — see `decide()`.
 */
export declare function recording(): boolean;
/**
 * Flushes all exporters, e.g. before `process.exit()`,
 * which does not emit `beforeExit`.
 */
export declare function flush(): Promise<void>;
export interface Exporter {
    export: (span: Span, output: Console) => void;
    flush?: () => Promise<void>;
}
export interface Span {
    name: string;
    traceId: string;
    spanId: string;
    parentId?: string;
    kind: Kind;
    time: number;
    duration: number;
    attributes?: object;
    scope?: object;
    service?: string;
    status?: 'error';
}
