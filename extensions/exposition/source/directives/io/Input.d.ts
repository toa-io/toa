import type { Directive } from './Directive.js';
import type { Input as Context } from '../../io.js';
export declare class Input implements Directive {
    private readonly allowed;
    constructor(permissions: Permissions);
    static validate(permissions: unknown): asserts permissions is Permissions;
    preflight(context: Context): void;
    private check;
    private violation;
}
export type Permissions = string[];
