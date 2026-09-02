export { Emitter };
import { Connector } from '@toa.io/core';
/**
 * @implements {toa.core.bindings.Emitter}
 */
declare class Emitter extends Connector implements toa.core.bindings.Emitter {
    #private;
    constructor(comm: any, locator: any, label: any);
    emit(message: any): Promise<void>;
}
