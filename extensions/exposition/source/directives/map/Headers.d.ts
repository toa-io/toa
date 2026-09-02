import { Mapping } from './Mapping.js';
import type { Input } from '../../io.js';
export declare class Headers extends Mapping<Record<string, string>> {
    private readonly headers;
    constructor(map: Record<string, string>);
    properties(context: Input): Record<string, string>;
}
