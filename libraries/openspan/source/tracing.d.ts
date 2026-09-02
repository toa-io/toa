export declare function run<T>(context: SpanContext, fn: () => T): T;
export declare function current(): SpanContext | undefined;
/**
 * Configures head-based sampling. Replaces the current configuration entirely.
 *
 * `sample` is the probability (0..1) of recording a trace, defaults to 1.
 * `rate` is the maximum number of recorded traces per second per process
 * (may be fractional: 0.5 is one trace per 2 seconds), unlimited when omitted.
 */
export declare function sampling(options?: SamplingOptions): void;
/**
 * Makes the sampling decision for a trace root.
 */
export declare function decide(): boolean;
export declare function create(parent?: SpanContext): SpanContext;
export declare function decode(traceparent: string): SpanContext | null;
export declare function encode(context: SpanContext): string;
export interface SamplingOptions {
    sample?: number;
    rate?: number;
}
export interface SpanContext {
    traceId: string;
    /** absent when the trace is adopted by ID only, without a known parent span */
    spanId?: string;
    parentId?: string;
    sampled: boolean;
    /**
     * The logical service emitting the span (`service.name`).
     * Inherited by child spans within the process, never propagated over the wire.
     */
    service?: string;
    /** Allows marking the active span as failed without throwing */
    status?: 'error';
}
