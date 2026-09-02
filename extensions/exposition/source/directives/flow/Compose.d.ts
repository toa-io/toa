import type { Directive } from './types.js';
import type { Input as Context } from '../../io.js';
export declare class Compose implements Directive {
    private readonly expressions;
    constructor(composition: any);
    attach(context: Context): void;
    private compose;
    private execute;
}
