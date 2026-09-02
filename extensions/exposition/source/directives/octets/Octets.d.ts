import type { Directive } from './Directive.js';
import type { Output } from '../../io.js';
import type { Remotes } from '../../Remotes.js';
import type { Parameter, DirectiveFamily } from '../../RTD/index.js';
import type { Input } from './types.js';
export declare class Octets implements DirectiveFamily<Directive> {
    readonly name: string;
    readonly mandatory: boolean;
    private discovery;
    create(name: string, value: any, remotes: Remotes): Directive;
    preflight(directives: Directive[], input: Input, parameters: Parameter[]): Promise<Output>;
}
