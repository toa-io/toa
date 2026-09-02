import { Readable } from 'node:stream';
import { Provider } from '../Provider.js';
import type { Maybe } from '@toa.io/types';
import type { Metadata, Stream } from '../Entry.js';
import type { Secret, Secrets } from '../Secrets.js';
export interface S3Options {
    bucket: string;
    region?: string;
    endpoint?: string;
}
type S3Secrets = Secrets<'ACCESS_KEY_ID' | 'SECRET_ACCESS_KEY'>;
export declare class S3 extends Provider<S3Options> {
    static readonly SECRETS: readonly Secret[];
    private readonly bucket;
    private readonly client;
    constructor(options: S3Options, secrets?: S3Secrets);
    get(Key: string): Promise<Maybe<Stream>>;
    head(Key: string): Promise<Maybe<Metadata>>;
    put(Key: string, stream: Readable): Promise<void>;
    commit(Key: string, metadata: object): Promise<void>;
    delete(Key: string): Promise<void>;
    move(from: string, keyTo: string): Promise<Maybe<void>>;
    private try;
}
export {};
