/// <reference types="node" />
import { Duplex, PassThrough } from 'node:stream';
export declare function addStream(key: string, map: Record<string, Duplex>): void;
export declare class Stream extends Duplex {
    private forks;
    constructor();
    fork(): PassThrough;
    _read(): void;
    private increment;
    private decrement;
}
