import { Connector, type Locator, type extensions } from '@toa.io/core';
import type { Client } from './Client.js';
import type { Manifest } from './manifest.js';
export declare class Aspect extends Connector implements extensions.Aspect {
    readonly name = "configuration";
    private readonly locator;
    private readonly manifest;
    private readonly client;
    private readonly epoch;
    private value;
    private created;
    /**
     * Without a client the value is local: the variable, the defaults and the schema.
     * With one, the value is what the service holds, and it follows the service.
     */
    constructor(locator: Locator, manifest: Manifest, client: Client | null);
    invoke(path?: string[]): any;
    protected open(): Promise<void>;
    protected close(): Promise<void>;
    private readonly listener;
}
