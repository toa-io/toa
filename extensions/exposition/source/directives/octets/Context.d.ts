import { Directive } from './Directive.js';
import type { Output } from '../../io.js';
export declare class Context extends Directive {
    readonly targeted = false;
    readonly storage: string;
    constructor(value: unknown);
    apply(): Promise<Output>;
}
