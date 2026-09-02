import { Timing } from './Timing.js';
import { type Format } from './formats/index.js';
import type { OutgoingMessage } from './messages.js';
import type * as http from 'node:http';
export declare class Context {
    readonly id: string;
    readonly authority: string;
    readonly request: IncomingMessage;
    readonly url: URL;
    readonly subtype: string | null;
    readonly encoder: Format | null;
    readonly timing: Timing;
    readonly debug: boolean;
    readonly pipelines: Pipelines;
    private consumed;
    constructor(authority: string, request: IncomingMessage, properties: Properties, url: URL);
    buffer(): Promise<Buffer>;
    body<T>(): Promise<T>;
    private log;
}
export interface IncomingMessage extends http.IncomingMessage {
    url: string;
    method: string;
}
interface Pipelines {
    body: Array<(input: unknown) => unknown>;
    response: Array<(output: OutgoingMessage) => void | Promise<void>>;
}
interface Properties {
    debug: boolean;
}
export {};
