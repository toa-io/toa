export { Broadcast };
import { Connector } from '@toa.io/core';
/**
 * @implements {toa.core.bindings.Broadcast}
 */
declare class Broadcast extends Connector implements toa.core.bindings.Broadcast {
    #private;
    constructor(comm: any, locator: any, group: any);
    transmit(label: any, payload: any): Promise<void>;
    receive(label: any, callback: any): Promise<void>;
}
