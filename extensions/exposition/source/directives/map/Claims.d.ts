import { Mapping } from './Mapping.js';
import type { Remotes } from '../../Remotes.js';
import type { Input } from '../../io.js';
export declare class Claims extends Mapping<Record<string, string>> {
    private readonly discovery;
    private federation;
    constructor(map: Record<string, string>, remotes: Remotes);
    properties(context: Input): Promise<Record<string, string> | null>;
    private claims;
}
