import { Connector } from '@toa.io/core';
import type { bindings } from '@toa.io/core/types';
export declare class Consumer extends Connector implements bindings.Consumer {
    #private;
    constructor(comm: any, locator: any, endpoint: any);
    request(request: any): Promise<any>;
    task(request: any): Promise<void>;
}
