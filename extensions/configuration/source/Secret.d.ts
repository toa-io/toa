import { inspect } from 'node:util';
import type { Secret as Contract } from '@toa.io/types';
/** A configuration value that must not leak: a string only to whoever asks for it. */
export declare class Secret implements Contract {
    #private;
    constructor(value: string);
    unwrap(): string;
    toString(): string;
    toJSON(): string;
    [inspect.custom](): string;
}
export declare const REDACTED = "<REDACTED>";
