export { Consumer };
import { Connector } from '@toa.io/core';
/**
 * @implements {toa.core.bindings.Consumer}
 */
declare class Consumer extends Connector implements toa.core.bindings.Consumer {
    #private;
    constructor(comm: any, locator: any, endpoint: any);
    request(request: any): Promise<any>;
    task(request: any): Promise<void>;
}
