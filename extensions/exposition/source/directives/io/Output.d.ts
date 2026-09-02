import type { Directive } from './Directive.js';
import type { Input as Context } from '../../io.js';
export declare class Output implements Directive {
    private readonly disabled;
    private readonly omitted;
    private readonly permissions;
    private readonly allowed;
    constructor(permissions: Permissions);
    static validate(permissions: unknown): asserts permissions is Permissions;
    preflight(context: Context): void;
    private restriction;
    /** Runs per entity of a collection, hence the set and the absence of intermediates. */
    private fit;
}
export type Permissions = string[] | boolean;
