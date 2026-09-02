import { Connector } from '@toa.io/core';
import type { Bootloader } from './Factory.js';
/**
 * One per process: one remote to the values service and one subscription to its events,
 * shared by every Aspect. What the Aspects ask for is collected and sent as one call;
 * what the service creates afterwards is handed to whoever subscribed.
 */
export declare class Client extends Connector {
    /** Disconnected once, a connector keeps what it depended on, so a gone client is not reused. */
    disposed: boolean;
    private readonly boot;
    private readonly options;
    private readonly pending;
    private readonly listeners;
    private remote;
    private timer;
    private flushing;
    private fresh;
    private round;
    constructor(boot: Bootloader, options?: Partial<Options>);
    /** The configuration of a component for an epoch, once the service has one. */
    fetch(component: string, epoch: string): Promise<Value>;
    subscribe(component: string, epoch: string, listener: Listener): void;
    unsubscribe(component: string, epoch: string, listener: Listener): void;
    protected open(): Promise<void>;
    protected close(): Promise<void>;
    protected dispose(): Promise<void>;
    private schedule;
    private flush;
    /** Those the service has served are told; the rest stay for the next round. */
    private settle;
    private report;
    private backoff;
    /** A created object goes to the subscribers of its component and epoch, as it is. */
    private deliver;
}
export interface Options {
    base: number;
    max: number;
    /** Every n-th round of waiting is reported. */
    warn: number;
}
/** A configuration and when it was created; `0` for the deployed defaults. */
export interface Value {
    configuration: object;
    created: number;
}
export interface Fetched {
    component: string;
    epoch: string;
    configuration: object | null;
    created: number;
}
/** The `configuration.values.created` payload: the object as stored. */
export interface Created {
    component: string;
    epoch: string;
    configuration: object;
    _created: number;
}
export type Listener = (value: Value) => void;
