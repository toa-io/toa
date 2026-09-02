import { type Parameter } from '../../RTD/index.js';
import { type Directive, type Identity } from './types.js';
export declare class Id implements Directive {
    private readonly parameter;
    constructor(parameter: string);
    authorize(identity: Identity | null, _: unknown, parameters: Parameter[]): boolean;
}
