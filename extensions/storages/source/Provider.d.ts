import type { Metadata, Stream } from './Entry.js';
import type { Readable } from 'node:stream';
import type { Maybe } from '@toa.io/types';
import type { Secret, Secrets } from './Secrets.js';
export declare abstract class Provider<Options = unknown> {
    static readonly SECRETS?: readonly Secret[];
    readonly root?: string;
    readonly options: Options;
    protected constructor(options: Options, secrets?: Secrets);
    abstract get(path: string, options?: unknown): Promise<Maybe<Stream>>;
    abstract head(path: string): Promise<Maybe<Metadata>>;
    abstract put(path: string, stream: Readable): Promise<void>;
    abstract commit(path: string, metadata: Metadata): Promise<void>;
    abstract delete(path: string): Promise<void>;
    abstract move(from: string, to: string): Promise<Maybe<void>>;
}
export interface Constructor<Options = any> {
    SECRETS?: readonly Secret[];
    new (options: Options, secrets?: Secrets): Provider<Options>;
}
