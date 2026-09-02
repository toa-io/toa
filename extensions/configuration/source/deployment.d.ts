import { type Dependency } from '@toa.io/operations';
import type { Manifest } from './manifest.js';
import type { context } from '@toa.io/norm';
export declare function deployment(instances: Instance[], annotation?: Annotation): Dependency;
/** What the values service is given: the epoch, the schema and the defaults of every component. */
export declare function describe(instances: Instance[], annotation?: Annotation): Values;
export type Annotation = Record<string, any>;
export type Instance = context.Dependency<Manifest>;
export type Values = Record<string, Entry>;
export interface Entry {
    epoch: string;
    schema: object;
    defaults?: object;
}
