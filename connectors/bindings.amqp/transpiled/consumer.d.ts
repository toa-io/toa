/**
 * @implements {toa.core.bindings.Consumer}
 */
export class Consumer extends Connector implements toa.core.bindings.Consumer {
    constructor(comm: any, locator: any, endpoint: any);
    request(request: any): Promise<any>;
    #private;
}
import { Connector } from "@toa.io/core";
