import type { Output } from '../../io.js';
import type { Directive } from './types.js';
export declare class Throw implements Directive {
    private readonly message;
    constructor(message: string);
    apply(): Output;
}
