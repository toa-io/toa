import { Connector } from '@toa.io/core';
import type { Reporter } from './Reporter.js';
import type { Node } from './model.js';
/**
 * Announces the static description of a component.
 *
 * Delivery is guaranteed, so the repeat is not about reliability — it keeps
 * `_updated` fresh, which is how a removed component fades off the map.
 */
export declare class Tenant extends Connector {
    private readonly reporter;
    private readonly node;
    private stopped;
    constructor(reporter: Reporter, node: Node);
    protected open(): Promise<void>;
    protected dispose(): void;
    private announce;
}
