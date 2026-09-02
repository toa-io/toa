export { Receiver };
import { Connector } from '@toa.io/core';
declare class Receiver extends Connector {
    #private;
    constructor(comm: any, label: any, group: any, receiver: any);
    open(): Promise<void>;
    /**
     * Stops consuming before the receiver it consumes for is taken apart.
     *
     * The receiver is a dependency, and a dependency is disconnected only once this has
     * returned — so what is closed here is closed while the receiver is still whole.
     * Sealing does not recall deliveries already dispatched, hence the wait for those
     * still running.
     */
    close(): Promise<void>;
}
