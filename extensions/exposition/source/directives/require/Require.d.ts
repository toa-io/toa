import type { Input } from '../../io.js';
import type { Directive } from './Directive.js';
import type { DirectiveFamily } from '../../RTD/index.js';
export declare class Require implements DirectiveFamily {
    readonly name = "require";
    readonly mandatory = false;
    create(name: string, value: unknown): Directive;
    preflight(instances: Directive[], context: Input): null;
}
