import { Readable } from 'node:stream';
import { Connector } from '@toa.io/core';
import type { Route } from './extension.js';
import type { Bootloader } from './Factory.js';
export declare class Routes extends Connector {
    events: Events;
    private readonly boot;
    constructor(boot: Bootloader);
    private static read;
    open(): Promise<void>;
    close(): Promise<void>;
}
declare class Events extends Readable {
    constructor();
    _read(): void;
}
export type { Route };
