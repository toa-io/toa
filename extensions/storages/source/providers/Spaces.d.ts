import { S3 } from './S3.js';
import type { Secret, Secrets } from '../Secrets.js';
export interface SpacesOptions {
    space: string;
    region: string;
}
type SpacesSecrets = Secrets<'ACCESS_KEY_ID' | 'SECRET_ACCESS_KEY'>;
export declare class Spaces extends S3 {
    static readonly SECRETS: readonly Secret[];
    constructor(options: SpacesOptions, secrets?: SpacesSecrets);
}
export {};
