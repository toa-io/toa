import type { Sync } from './lib/throttle/index.js';
import type { Parameter } from '../../RTD/index.js';
import type { Input as Context } from '../../io.js';
import type * as http from '../../HTTP/index.js';
export interface Directive {
    preflight: (context: Context, parameters: Parameter[]) => void;
    /** Synchronous by contract: settling holds the response, and none of it needs I/O. */
    settle?: (context: Context, response: http.OutgoingMessage) => void;
}
export interface Constructor {
    validate: (value: unknown) => void;
    new (value: any, sync: Sync, route: string): Directive;
}
