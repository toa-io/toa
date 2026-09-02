import type { Exporter, Span } from './exporters.js';
/**
 * Exports spans to an OTLP/HTTP endpoint (JSON encoding).
 *
 * Spans are batched and flushed when the batch is full or on an interval,
 * and on `beforeExit`.
 *
 * The exporter is tolerant to an absent or unavailable endpoint: a request is bounded by
 * a timeout, a failed batch is dropped, and the exporter suspends itself for a cooldown
 * period, dropping spans instead of queueing them. A single warning is logged per outage,
 * so that neither the process lifecycle nor the log is affected by the missing infrastructure.
 */
export declare class Otlp implements Exporter {
    private readonly url;
    private readonly transport;
    private readonly options;
    private readonly headers;
    private readonly service;
    private readonly timeout;
    private readonly cooldown;
    private queue;
    private timer;
    private sending;
    private suspendedUntil;
    private reported;
    constructor(options: OtlpOptions);
    private get suspended();
    export(span: Span): void;
    /**
     * Never rejects and is bounded by a single request timeout: an unavailable endpoint
     * suspends the exporter, dropping whatever is left in the queue.
     */
    flush(): Promise<void>;
    private send;
    private post;
    /**
     * `node:http` rather than `fetch`, as destroying a request releases its socket, while
     * aborting a `fetch` does not: a connection attempt to an unroutable endpoint keeps
     * the process alive until the OS gives up on it, delaying the shutdown.
     */
    private transmit;
    private suspend;
    private resume;
    private request;
    private span;
}
export interface OtlpOptions {
    endpoint: string;
    headers?: Record<string, string>;
    service?: string;
    /** Request timeout in milliseconds, bounds how long a shutdown can wait for the endpoint. */
    timeout?: number;
    /** Milliseconds to drop spans for after a failed export, before trying the endpoint again. */
    cooldown?: number;
}
