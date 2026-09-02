import type { Input } from './types.js';
import type { Parameter } from '../../RTD/index.js';
import type * as io from '../../io.js';
export declare abstract class Directive {
    readonly name: string;
    abstract readonly targeted: boolean;
    abstract apply(storage: string, input: Input, parameters: Parameter[]): Promise<io.Output>;
}
