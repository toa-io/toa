import { type bindings, Connector } from '@toa.io/core';
import * as http from './HTTP/index.js';
import type { Interception } from './Interception.js';
import type { Tree } from './RTD/index.js';
import type { Label } from './discovery.js';
export declare class Gateway extends Connector {
    private readonly broadcast;
    private readonly tree;
    private readonly interceptor;
    private readonly branches;
    private lastMerge;
    private widestGap;
    private lastPing;
    private stopped;
    private resolveFirstMerge;
    constructor(broadcast: Broadcast, tree: Tree, interception: Interception);
    process(context: http.Context): Promise<http.OutgoingMessage>;
    protected open(): Promise<void>;
    /**
     * Both of these reach into components, and a dependency is torn down only once this has
     * returned — where `dispose` runs after every one of them already has. The throttling
     * ticker firing in between calls an endpoint that has just been unbound, and reports the
     * refusal as a failure to reconcile.
     */
    protected close(): Promise<void>;
    protected dispose(): void;
    private match;
    private call;
    private explain;
    private discover;
    /**
     * A single ping is enough only if every tenant is listening by then, which is
     * not the case while the deployment is still rolling out.
     */
    private knock;
    private ping;
    private reping;
    private settled;
    /**
     * How long the branches must stay quiet before discovery counts as settled.
     *
     * Every tenant of a local composition answers the first ping at once, so a short window
     * is enough; a rolling deployment brings them up seconds apart, and the window grows with
     * the widest gap seen so far to keep waiting for the ones still starting.
     */
    private quiet;
    private merge;
}
export type Broadcast = bindings.Broadcast<Label>;
