import { Connector } from '@toa.io/core';
export declare class Producer extends Connector {
    #private;
    constructor(comm: any, locator: any, endpoints: any, component: any);
    open(): Promise<void>;
    /**
     * Stops consuming before the component it consumes for is taken apart.
     *
     * The component is a dependency, and a dependency is disconnected only once this has
     * returned — so what is closed here is closed while the component is still whole.
     * Sealing does not recall deliveries already dispatched, of which there can be as many
     * as the channel's prefetch, hence the wait for those still running.
     *
     * A message that arrives after this is left in its queue for whoever comes up next,
     * which is what a durable queue is for.
     */
    close(): Promise<void>;
}
