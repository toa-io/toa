import { Connector, type extensions } from '@toa.io/core';
import type { Connection } from './Connection';
export declare class Aspect extends Connector implements extensions.Aspect {
    readonly name = "stash";
    private readonly connection;
    private redis;
    private redlock;
    constructor(connection: Connection);
    invoke(method: 'store', key: string, value: object): Promise<void>;
    invoke(method: 'fetch', key: string): Promise<object>;
    invoke<T>(method: 'lock', key: Resources, routine: Routine<T>): Promise<T>;
    invoke(method: string, ...args: unknown[]): Promise<any>;
    protected open(): Promise<void>;
    private store;
    private fetch;
    private lock;
}
type Routine<T> = () => Promise<T>;
type Resources = string | string[];
export {};
