import { Mapping } from './Mapping.js';
import type { Input } from '../../io.js';
export declare class Authority extends Mapping<string> {
    constructor(property: string);
    properties(context: Input): Record<string, string>;
}
