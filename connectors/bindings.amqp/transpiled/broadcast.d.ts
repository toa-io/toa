/**
 * @implements {toa.core.bindings.Broadcast}
 */
export class Broadcast extends Connector implements toa.core.bindings.Broadcast {
    constructor(comm: any, locator: any, group: any);
    transmit(label: any, payload: any): Promise<void>;
    receive(label: any, callback: any): Promise<void>;
    #private;
}
import { Connector } from "@toa.io/core";
