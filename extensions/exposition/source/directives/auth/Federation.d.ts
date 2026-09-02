import type { Directive, Identity, Context } from './types.js';
import type { Parameter } from '../../RTD/index.js';
export declare class Federation implements Directive {
    private readonly matchers;
    constructor(options: Options);
    authorize(identity: Identity | null, context: Context, parameters: Parameter[]): boolean;
}
interface Claims {
    iss: string;
    sub: string;
    aud: string | string[];
}
interface Options extends Partial<Claims> {
    iss: string;
}
export {};
