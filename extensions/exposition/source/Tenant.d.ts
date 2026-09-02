import { Connector } from '@toa.io/core';
import type { bindings } from '@toa.io/core';
import type { Label } from './discovery.js';
import type { Branch } from './Branch.js';
export declare class Tenant extends Connector {
    private readonly broadcast;
    private readonly branch;
    private started;
    private stopped;
    constructor(broadcast: Broadcast, branch: Omit<Branch, 'timestamp'>);
    open(): Promise<void>;
    /**
     * Announcing is stopped where the teardown begins, not in `dispose`, which a connector
     * runs after every one of its dependencies has gone. A component on its way out that
     * announces itself once more has its routes held open by whoever is listening, and the
     * requests that follow reach nothing.
     */
    protected close(): Promise<void>;
    private announce;
    private expose;
}
type Broadcast = bindings.Broadcast<Label>;
export {};
