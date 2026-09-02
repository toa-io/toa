import type { Output } from '../../io.js';
import type { Directive } from './types.js';
export declare class Faulty implements Directive {
    private static readonly warned;
    private readonly probability;
    constructor(probability: number);
    apply(): Promise<Output>;
}
