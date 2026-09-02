import type { Directive } from './types.js';
import type { Input, Output } from '../../io.js';
import type { DirectiveFamily, Parameter } from '../../RTD/index.js';
import type { Remotes } from '../../Remotes.js';
export declare class Flow implements DirectiveFamily<Directive> {
    readonly name: string;
    readonly mandatory: boolean;
    create(name: string, value: unknown, remotes: Remotes): Directive;
    preflight(directives: Directive[], input: Input, parameters: Parameter[]): Promise<Output>;
}
