import { type Directive, type Context } from './types.js';
export declare class Anyone implements Directive {
    private readonly allow;
    constructor(allow: boolean);
    authorize(_: any, context: Context): boolean;
}
