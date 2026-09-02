import type { Input, Output } from '../../../../../io.js';
import type { Condition } from './Condition.js';
export declare class Status implements Condition {
    private readonly status;
    constructor(status: unknown);
    match(input: Input, output: Output): boolean;
}
