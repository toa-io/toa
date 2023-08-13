/**
 * @implements {toa.core.bindings.Emitter}
 */
export class Emitter extends Connector implements toa.core.bindings.Emitter {
    constructor(comm: any, locator: any, label: any);
    emit(message: any): Promise<void>;
    #private;
}
import { Connector } from "@toa.io/core";
