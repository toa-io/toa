import { Connector } from '@toa.io/core';
import type { bindings } from '@toa.io/core/types';
export declare class Emitter extends Connector implements bindings.Emitter {
    #private;
    constructor(comm: any, locator: any, label: any);
    emit(message: any): Promise<void>;
}
