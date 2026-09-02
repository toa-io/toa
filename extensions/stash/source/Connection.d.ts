import { Redis } from 'ioredis';
import { Connector, type Locator } from '@toa.io/core';
export declare class Connection extends Connector {
    redis: Redis | null;
    readonly locator: Locator;
    constructor(locator: Locator);
    protected open(): Promise<void>;
    protected close(): Promise<void>;
    private resolveURL;
}
