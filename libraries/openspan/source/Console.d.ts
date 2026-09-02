import type { Span } from './exporters.js';
export declare class Console {
    readonly trace: Method;
    readonly debug: Method;
    readonly log: Method;
    readonly info: Method;
    readonly warn: Method;
    readonly error: Method;
    private level;
    private stdout;
    private stderr;
    private context?;
    constructor(options?: ConsoleOptions);
    configure(options?: ConsoleOptions): void;
    span<T>(name: string | SpanOptions, task: Task<T>): Promise<T>;
    span<T>(name: string, attributes: object, task: Task<T>): Promise<T>;
    /**
     * Writes an entry carrying fields a message alone cannot: a span rendered as a log line,
     * for instance. The channels above are the ordinary way in; this is for whoever composes
     * an entry of their own, which today is the console span exporter.
     */
    entry(channel: Channel, message: string, rest?: Partial<Entry>): void;
    fork(ctx?: any): Console;
    private channel;
    private complete;
    private write;
}
export declare const LEVELS: Record<LevelName, Level>;
/**
 * A process may load several copies of this module (see `state.ts`).
 * The singleton is shared via `globalThis`, so that `configure()`
 * (e.g. the log level set by the telemetry extension) applies to every copy.
 */
export declare const console: Console;
/**
 * Passes an externally completed span to the exporters.
 * Used for event-based instrumentation (e.g. database drivers),
 * where spans cannot wrap a task.
 */
export declare function record(span: Span, output?: Console): void;
export interface ConsoleOptions {
    level?: LevelName | Level;
    context?: any;
    streams?: Streams;
}
interface Streams {
    stdout: NodeJS.WriteStream;
    stderr: NodeJS.WriteStream;
}
export interface Entry {
    time: string;
    severity: Severity;
    message: string;
    attributes?: Record<string, any>;
    context?: Record<string, any>;
    trace_id?: string;
    span_id?: string;
    parent_id?: string;
    duration?: number;
    kind?: Kind;
    status?: 'error';
}
export interface SpanOptions {
    name: string;
    kind?: Kind;
    attributes?: object;
    /** the logical service emitting the span, inherited from the parent context when omitted */
    service?: string;
}
export type Channel = 'trace' | 'debug' | 'info' | 'warn' | 'error';
export type LevelName = Channel;
export type Kind = 'internal' | 'server' | 'client' | 'producer' | 'consumer';
export type Severity = Uppercase<LevelName>;
export type Task<T> = () => T | Promise<T>;
type Level = -2 | -1 | 0 | 1 | 2;
type Method = (message: string, attributes?: any) => void;
export {};
