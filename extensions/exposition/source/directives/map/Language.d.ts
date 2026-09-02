import { Mapping } from './Mapping.js';
import type { Input } from '../../io.js';
import type { Parameter } from '../../RTD/index.js';
import type { Directive } from './Directive.js';
export declare class Language extends Mapping<string> {
    private languages;
    constructor(property: string);
    properties(context: Input, parameters: Parameter[], directives: Directive[]): Record<string, string>;
    private resolve;
}
