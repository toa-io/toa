import { Readable } from 'node:stream';
import type { Unit } from './Workflow.js';
import type { Remotes } from '../../../Remotes.js';
import type { Entry } from '@toa.io/extensions.storages';
export declare class Execution extends Readable {
    private readonly units;
    private readonly remotes;
    private readonly context;
    private readonly components;
    private readonly discovery;
    private interrupted;
    constructor(context: Context, units: Unit[], remotes: Remotes);
    _read(): void;
    private run;
    private execute;
    private stream;
    private report;
    private exception;
    private call;
    private discover;
}
export interface Context {
    authority: string;
    identity?: string;
    storage: string;
    path: string;
    entry: Entry;
    parameters: Record<string, string>;
    steps: Record<string, unknown>;
}
