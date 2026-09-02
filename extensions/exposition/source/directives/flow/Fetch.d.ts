import type { Directive } from './types.js';
import type { Remotes } from '../../Remotes.js';
import type { Output } from '../../io.js';
import type { Input } from '../octets/types.js';
import type { Parameter } from '../../RTD/index.js';
export declare class Fetch implements Directive {
    private readonly connecting;
    private remote;
    private readonly operation;
    constructor(endpoint: string, discovery: Remotes);
    apply(input: Input, parameters: Parameter[]): Promise<Output>;
}
