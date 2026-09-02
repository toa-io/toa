import { AsyncLocalStorage } from 'node:async_hooks';
import type { SpanContext } from './tracing.js';
import type { Exporter } from './exporters.js';
/**
 * A process may load several copies of this module (e.g. a service with its own
 * `node_modules` running on a globally installed runtime). The trace context,
 * the sampling configuration and the exporters must be shared between them,
 * otherwise each copy runs its own trace: spans lose their parents, and the
 * sampling decision is re-made in the middle of a trace.
 * The state is therefore shared via `globalThis`.
 */
interface State {
    storage: AsyncLocalStorage<SpanContext>;
    sample: number;
    bucket: Bucket | null;
    exporters: Exporter[] | null;
}
/** Structural, as instances may originate from another copy of the module. */
export interface Bucket {
    take: () => boolean;
}
export declare const state: State;
export {};
