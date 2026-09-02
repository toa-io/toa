import { Mapping } from './Mapping.js';
import type { Input } from '../../io.js';
export declare class BufferMapping extends Mapping<string> {
    constructor(property: string);
    properties(context: Input): Promise<Record<string, string>>;
}
