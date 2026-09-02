import { Temporary, type TemporaryOptions } from './Temporary.js';
import type { Secret } from '../Secrets.js';
export declare class Test extends Temporary {
    static readonly SECRETS: readonly Secret[];
    constructor(options: TemporaryOptions);
}
