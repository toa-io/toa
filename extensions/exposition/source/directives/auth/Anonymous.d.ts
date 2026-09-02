import { type Directive, type Context } from './types.js';
export declare class Anonymous implements Directive {
    private readonly allow;
    constructor(allow: boolean);
    authorize(_: any, context: Context): boolean;
}
