import { Mapping } from './Mapping.js';
import type { Parameter } from '../../RTD/index.js';
export declare class Segments extends Mapping<Record<string, string>> {
    constructor(map: Record<string, string>);
    properties(_: unknown, parameters: Parameter[]): Record<string, string>;
}
