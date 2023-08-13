import { type Dependency } from '@toa.io/operations';
import { type Manifest } from './manifest';
import type { context } from '@toa.io/norm';
export declare function deployment(instances: Instance[], annotation: Annotation): Dependency;
export type Annotation = Record<string, object>;
export type Instance = context.Dependency<Manifest>;
