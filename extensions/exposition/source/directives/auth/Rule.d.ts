import { type Parameter } from '../../RTD/index.js';
import type { Context, Directive, Identity, Create } from './types.js';
export declare class Rule implements Directive {
    private readonly directives;
    constructor(directives: Record<string, any>, create: Create);
    authorize(identity: Identity | null, context: Context, parameters: Parameter[]): Promise<boolean>;
}
