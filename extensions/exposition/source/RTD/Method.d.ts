import type { Parameter } from './Match.js';
import type { Endpoint } from './Endpoint.js';
import type { Directives } from './Directives.js';
export declare class Method {
    readonly endpoint: Endpoint | null;
    readonly directives: Directives;
    private introspection;
    private introspecting;
    constructor(endpoint: Endpoint | null, directives: Directives);
    explain(parameters: Parameter[]): Promise<unknown>;
    close(): Promise<void>;
}
export type Methods = Record<string, Method>;
