import { Readable } from 'node:stream';
import { Provider } from '../Provider.js';
import type { Maybe } from '@toa.io/types';
import type { Metadata, Stream } from '../Entry.js';
import type { Secret, Secrets } from '../Secrets.js';
import type { TransformationOptions } from 'cloudinary';
export type CloudinarySecrets = Secrets<'API_KEY' | 'API_SECRET'>;
export declare class Cloudinary extends Provider<CloudinaryOptions> {
    static readonly SECRETS: readonly Secret[];
    private readonly type;
    private readonly eager;
    private readonly transformations;
    private readonly config;
    private readonly prefix;
    constructor(options: CloudinaryOptions, secrets?: CloudinarySecrets);
    get(path: string, options?: GetOptions): Promise<Maybe<Stream>>;
    head(path: string): Promise<Maybe<Metadata>>;
    put(path: string, stream: Readable): Promise<void>;
    commit(): Promise<void>;
    delete(path: string): Promise<void>;
    move(from: string, to: string): Promise<void | Error>;
    private fetch;
    private url;
    private toTransformation;
    private mapTransformation;
    private metadata;
    private cloudinary;
}
interface GetOptions {
    agent?: string;
    range?: string;
}
export interface CloudinaryOptions {
    environment: string;
    type: StorageType;
    prefix?: string;
    eager?: TransformationOptions[];
    transformations?: TransformationDeclaration[];
}
type TransformationDeclaration = Omit<Transformation, 'extension'> & {
    extension: string;
};
interface Transformation {
    extension: RegExp;
    condition?: string;
    transformation: Record<string, unknown> | Array<Record<string, unknown>>;
    optional?: boolean;
}
type StorageType = 'image' | 'video';
export {};
