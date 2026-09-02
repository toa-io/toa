import type { Input } from '../../io.js';
import type { Directive } from './Directive.js';
export declare class Headers implements Directive {
    private readonly headers;
    constructor(headers: string[]);
    preflight(context: Input): void;
}
