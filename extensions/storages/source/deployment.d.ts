import type { Dependency } from '@toa.io/operations';
import type { context } from '@toa.io/norm';
export declare const ENV_PREFIX = "TOA_STORAGES";
export declare function deployment(instances: Instance[], annotation: unknown): Dependency;
export type Instance = context.Dependency<string[]>;
