import type { Remotes } from '../../Remotes.js';
import type { Directive } from './Directive.js';
import type { Input } from '../../io.js';
import type { Parameter } from '../../RTD/index.js';
export declare abstract class Mapping<T = unknown> {
    protected value: T;
    protected remotes?: Remotes;
    protected constructor(value: T, remotes?: Remotes);
    abstract properties(context: Input, parameters: Parameter[], directives: Directive[]): Output;
}
type Properties = Record<string, unknown> | null;
type Output = Properties | Promise<Properties>;
export {};
