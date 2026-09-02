import { Connector } from '@toa.io/core';
export declare class Ready extends Connector {
    #private;
    readonly name = "ready";
    private readonly server;
    private readonly options;
    private ready;
    private startedAt;
    private listening;
    private skipped;
    constructor(options: ReadyOptions);
    static create(): Ready | null;
    listen(): Promise<void>;
    complete(): Promise<void>;
    protected open(): Promise<void>;
    protected close(): Promise<void>;
}
export declare function resolveOptions(): ReadyOptions | null;
export declare function normalizeAnnotation(ready: ReadyAnnotation | undefined): ReadyConfig | false;
export declare const READY_ENV = "TOA_TELEMETRY_READY";
export declare const DEFAULT_ANNOTATION: {
    readonly path: '/.ready';
    readonly port: 8001;
};
export interface ReadyOptions {
    path: string;
    port: number;
}
export type ReadyAnnotation = false | {
    path?: string;
    port?: number;
};
export type ReadyConfig = false | {
    enabled?: boolean;
    path?: string;
    port?: number;
};
