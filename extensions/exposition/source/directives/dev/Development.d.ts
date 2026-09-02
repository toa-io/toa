import { type Directive } from './types.js';
import type { Input, Output } from '../../io.js';
import type { DirectiveFamily } from '../../RTD/index.js';
export declare class Development implements DirectiveFamily<Directive> {
    readonly name: string;
    readonly mandatory: boolean;
    create(name: string, value: unknown): Directive;
    preflight(directives: Directive[], input: Input): Promise<Output>;
}
