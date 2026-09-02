import type { Output } from '../../io.js';
import type { AuthenticatedContext, Directive } from './types.js';
import type { DirectiveFamily } from '../../RTD/index.js';
import type * as http from '../../HTTP/index.js';
export declare class Cache implements DirectiveFamily<Directive> {
    readonly name: string;
    readonly mandatory: boolean;
    create(name: string, value: any): Directive;
    preflight(): Output;
    settle(directives: Directive[], context: AuthenticatedContext, response: http.OutgoingMessage): Promise<void>;
}
