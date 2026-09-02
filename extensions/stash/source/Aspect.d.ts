import { Connector, type extensions } from '@toa.io/core';
import type { Connection } from './Connection.js';
export declare class Aspect extends Connector implements extensions.Aspect {
    readonly name = "stash";
    private readonly connection;
    private redis;
    constructor(connection: Connection);
    invoke(method: 'store', key: string, value: object): any;
    invoke(method: 'fetch', key: string): any;
    invoke(method: string, ...args: unknown[]): any;
    protected open(): Promise<void>;
    private store;
    private fetch;
}
