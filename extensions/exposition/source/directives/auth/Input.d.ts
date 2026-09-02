import type { Parameter } from '../../RTD/index.js';
import type { Context, Directive, Identity, Create } from './types.js';
export declare class Input implements Directive {
    priority: number;
    private readonly statements;
    constructor(declarations: Declaration[], create: Create);
    authorize(identity: Identity | null, context: Context, parameters: Parameter[]): Promise<boolean>;
    private check;
}
export interface Declaration {
    [key: Exclude<string, 'prop'>]: unknown;
    prop: string | string[];
}
