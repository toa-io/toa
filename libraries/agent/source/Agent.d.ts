import * as http from 'node:http';
import * as undici from 'undici';
import { meros } from 'meros/node';
import { Captures } from './Captures.js';
import type { Readable } from 'stream';
export declare class Agent {
    readonly origin?: string;
    response: string;
    /** The last response body, as received. A binary body does not survive `response`. */
    bytes: Buffer | null;
    readonly captures: Captures;
    pending: Set<http.IncomingMessage>;
    constructor(origin?: string, captures?: Captures);
    fetch(input: string, options?: Partial<undici.Dispatcher.RequestOptions>): Promise<undici.Dispatcher.ResponseData>;
    request(input: string): Promise<any>;
    parts(input: string): Promise<ReturnType<typeof meros>>;
    abort(): void;
    responseIncludes(expected: string): void;
    mismatch(sample: string, reference: string): string | null;
    responseExcludes(expected: string): void;
    stream(head: string, stream: Readable): Promise<any>;
    streamMatch(head: string, stream: Readable): Promise<any>;
    private normalize;
}
