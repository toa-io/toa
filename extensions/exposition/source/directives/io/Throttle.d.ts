import { type Declaration, type Sync } from './lib/throttle/index.js';
import type * as http from '../../HTTP/index.js';
import type { Parameter } from '../../RTD/index.js';
import type { Directive } from './Directive.js';
export declare class Throttle implements Directive {
    private readonly quotas;
    constructor(declaration: Declaration, sync: Sync, route: string);
    static validate(declaration: unknown): asserts declaration is Declaration;
    preflight(context: http.Context, parameters: Parameter[]): void;
    settle(context: http.Context, output: http.OutgoingMessage): void;
}
