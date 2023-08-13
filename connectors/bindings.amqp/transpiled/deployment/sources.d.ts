import { type Dependency } from '@toa.io/operations';
import { type Locator } from '@toa.io/core';
import { type Instance } from './instance';
import { type Annotation } from './annotation';
export declare function createDependency(sources: Sources, instances: Instance[]): Dependency;
export declare function resolveURIs(locator: Locator, label: string): Promise<string[]>;
type Sources = Annotation['sources'];
export {};
