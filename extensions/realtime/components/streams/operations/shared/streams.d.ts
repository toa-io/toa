/// <reference types="node" />
import { Duplex } from 'node:stream';
export declare class Stream extends Duplex {
    constructor();
    _read(): void;
}
