import type { Directive } from './types.js';
import type { Input, Output } from '../../io.js';
export declare class Sleep implements Directive {
    private static warned;
    private readonly maximum;
    constructor(value: number);
    apply(input: Input): Promise<Output>;
    private parse;
}
