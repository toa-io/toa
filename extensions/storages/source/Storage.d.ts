import type { Readable } from 'node:stream';
import type { Attributes, Entry, Stream } from './Entry.js';
import type { ScanOptions } from './Scanner.js';
import type { Provider } from './Provider.js';
export declare class Storage<T extends Provider = Provider> {
    private readonly provider;
    private readonly scope?;
    constructor(provider: T, scope?: Scope);
    options(): T['options'];
    put(path: string, stream: Readable, options?: Options): Maybe<Entry>;
    get(path: string, options?: unknown): Maybe<Stream>;
    head(path: string): Promise<Maybe<Entry>>;
    delete(path: string): Maybe<void>;
    path(): string | null;
    private locate;
    private span;
}
interface Options extends ScanOptions {
    id?: string;
    origin?: string;
    attributes?: Attributes;
}
type Maybe<T> = Promise<T | Error>;
export interface Scope {
    /** the logical storage name, e.g. `octets` */
    name: string;
    /** the provider id, e.g. `s3` */
    provider: string;
}
export type Storages = Record<string, Storage>;
export {};
