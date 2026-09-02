import { Execution } from './Execution.js';
import type { Entry } from '@toa.io/extensions.storages';
import type { Parameter } from '../../../RTD/index.js';
import type { Remotes } from '../../../Remotes.js';
export declare class Workflow {
    private readonly units;
    private readonly remotes;
    constructor(units: Unit[] | Unit, remotes: Remotes);
    execute(location: Location, entry: Entry, params: Parameter[]): Execution;
}
export interface Location {
    authority: string;
    identity?: string;
    storage: string;
    path: string;
}
export type Unit = Record<string, string>;
