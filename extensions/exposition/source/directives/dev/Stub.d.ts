import type { Output } from '../../io.js';
import type { Directive } from './types.js';
export declare class Stub implements Directive {
    private readonly value;
    constructor(value: unknown);
    apply(): Output;
}
