import { Connector, type Remote } from '@toa.io/core';
import { type Bootloader } from './Factory.js';
export declare class Remotes extends Connector {
    private readonly boot;
    private readonly cache;
    constructor(boot: Bootloader);
    discover(namespace: string, name: string, version?: string): Promise<Remote>;
    private locate;
}
