import type { Quotas } from './Quotas.js';
import type { Remote } from '@toa.io/core';
/**
 * Reconciles every quota of the process with the other gateways, on one tick.
 *
 * Nothing here is on the request path. Each tick takes what the quotas have spent since
 * the last one and sends all of it as a single call, so the cost of staying in step is
 * one round trip a tick — not one per key, and not one per directive. What comes back is
 * the debt the whole group has reached, which the quotas then decide on locally.
 */
export declare class Sync {
    private readonly atom;
    private readonly quotas;
    private remote;
    private timer;
    private period;
    /** Ticks do not overlap: a slow round trip delays reconciling, it does not double it. */
    private reconciling;
    constructor(atom: Promise<Remote>);
    register(quotas: Quotas): void;
    dispose(): void;
    private start;
    private readonly tick;
    private reconcile;
}
export interface Batch {
    quotas: Quotas;
    key: string;
    delta: number;
}
