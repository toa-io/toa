import { Redis } from 'ioredis';
import { Connector, type Locator } from '@toa.io/core';
export declare class Connection extends Connector {
    readonly redises: Redis[];
    private readonly locator;
    constructor(locator: Locator);
    protected open(): Promise<void>;
    protected close(): Promise<void>;
    private connectNode;
    private resolveURLs;
}
