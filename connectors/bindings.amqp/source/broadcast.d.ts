import { Connector } from '@toa.io/core';
import type { bindings } from '@toa.io/core/types';
export declare class Broadcast extends Connector implements bindings.Broadcast {
    #private;
    constructor(comm: any, locator: any, group: any);
    transmit(label: any, payload: any): Promise<void>;
    receive(label: any, callback: any): Promise<void>;
}
