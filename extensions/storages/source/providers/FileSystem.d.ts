import { Provider } from '../Provider.js';
import type { Readable } from 'node:stream';
import type { Maybe } from '@toa.io/types';
import type { Metadata, Stream } from '../Entry.js';
export interface FileSystemOptions {
    path: string;
    claim?: string;
}
export declare class FileSystem extends Provider<FileSystemOptions> {
    readonly root: string;
    constructor(options: FileSystemOptions);
    get(rel: string): Promise<Maybe<Stream>>;
    head(rel: string): Promise<Maybe<Metadata>>;
    put(rel: string, stream: Readable): Promise<void>;
    commit(rel: string, metadata: Metadata): Promise<void>;
    delete(path: string): Promise<void>;
    move(from: string, to: string): Promise<Maybe<void>>;
    private blob;
    private meta;
    private join;
    private try;
}
