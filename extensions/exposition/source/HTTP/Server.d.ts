import { Connector } from '@toa.io/core';
import { type OutgoingMessage } from './messages.js';
import { Context } from './Context.js';
export declare class Server extends Connector {
    private readonly server;
    private readonly properties;
    private readonly authorities;
    private process?;
    private ready;
    private startedAt;
    private constructor();
    static create(options: Options): Server;
    attach(process: Processor): void;
    protected open(): Promise<void>;
    protected close(): Promise<void>;
    private listener;
    private serve;
    private success;
    private fail;
}
export declare const PORT = 8000;
/**
 * The initial delay of the readiness probe. The server does not sleep for it: whoever
 * probes is the one that waits, and doing it here as well only delayed the process twice.
 */
export declare const DELAY = 3;
export declare const DRAIN = 10;
interface Properties {
    authorities: Record<string, string>;
    methods: Set<string>;
    debug: boolean;
    port: number;
    drain: number;
}
export type Options = {
    authorities: Properties['authorities'];
} & {
    [K in Exclude<keyof Properties, 'authorities'>]?: Properties[K];
};
export type Processor = (input: Context) => Promise<OutgoingMessage>;
export {};
