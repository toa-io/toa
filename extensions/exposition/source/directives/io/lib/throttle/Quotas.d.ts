import { Keys } from './Keys.js';
import type { Batch } from './Sync.js';
import type { Configuration } from './Configuration.js';
import type { Parameter } from '../../../../RTD/index.js';
import type { Input as Context, Output } from '../../../../io.js';
/**
 * A quota per key, metered by GCRA, decided in this process and shared with the others.
 *
 * The state of a key is one theoretical arrival time: the moment the key would be back
 * at zero if nothing more arrived. An admitted request pushes it `emission` further out,
 * time drags it back, and a request is admitted while it stays within `capacity` of now.
 * So `requests` is what a key may spend at once, and `requests / interval` what it earns
 * back — no window to burst across the edge of, and no lockout to time out of.
 *
 * Deciding needs nothing but the local map, which is what keeps the request path free of
 * I/O. What the other gateways have spent arrives on {@link Sync}'s tick, as a debt in
 * milliseconds — a duration, so it carries across processes without their clocks having
 * to agree, and additive, which is what lets each process report only its own increments.
 */
export declare class Quotas {
    /** How often the debt is worth reconciling with the other gateways, in milliseconds. */
    readonly period: number;
    /** Milliseconds of debt an admitted request adds, `interval / requests`. */
    private readonly emission;
    /** Debt a key may carry before it is refused, `interval` — a burst of `requests`. */
    private readonly capacity;
    private readonly keys;
    private readonly prefix;
    private readonly conditional;
    private readonly entries;
    /**
     * The key computed at preflight, for settle to charge against.
     *
     * `segment` reads the route parameters, which settle is not given, and `identity`
     * can be refreshed between the two — so recomputing there would key a request
     * differently than it was checked, and throttling would quietly stop working.
     */
    private readonly keyed;
    constructor(options: Options);
    static create(configuration: Configuration, route?: string): Quotas;
    /**
     * Seconds to wait before the request would be admitted, or zero when it is.
     *
     * Charges here when nothing conditions the count, so that the request is metered by
     * the same call that admits it; otherwise only the response can tell whether it counts,
     * and {@link use} charges once it can.
     */
    check(context: Context, parameters: Parameter[]): number;
    /** Charges what the condition accepts, once the response can be matched against it. */
    use(input: Context, output: Output): void;
    /**
     * Adds what is worth reporting to the batch, and drops what has gone quiet.
     *
     * The debt is not cleared here but in {@link settled}, so a tick that fails to reach
     * Redis leaves it to be reported by the next one instead of losing it.
     */
    flush(now: number, batch: Batch[]): void;
    /** Takes the group's debt back, and clears what this process contributed to it. */
    settled(reported: Batch, debt: number, now: number): void;
    name(key: string): string;
    private charge;
}
interface Options {
    keys: Keys;
    requests: number;
    interval: number;
    conditional: boolean;
}
export {};
