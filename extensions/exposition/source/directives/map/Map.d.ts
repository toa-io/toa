import { Property } from './Properties.js';
import { Mapping } from './Mapping.js';
import type { Directive } from './Directive.js';
import type { DirectiveFamily, Parameter } from '../../RTD/index.js';
import type { Input, Output } from '../../io.js';
import type { Remotes } from '../../Remotes.js';
export declare class Map implements DirectiveFamily {
    readonly name = "map";
    readonly mandatory = false;
    private remotes;
    create(name: string, value: unknown, remotes: Remotes): Property | Mapping;
    preflight(directives: Directive[], context: Input, parameters: Parameter[]): Promise<Output>;
}
