import { type Directive, type Identity, type Context } from './types.js';
export declare class Scheme implements Directive {
    private readonly scheme;
    private readonly Scheme;
    constructor(scheme: string);
    authorize(_: Identity | null, context: Context): boolean;
}
