import { Connector, type extensions } from '@toa.io/core';
import { type Storage, type Storages } from './Storage.js';
export declare class Aspect extends Connector implements extensions.Aspect {
    readonly name = "storages";
    private readonly storages;
    constructor(storages: Storages);
    invoke(name: string, method: keyof Storage, ...args: unknown[]): unknown;
}
