import { type Dependency } from '@toa.io/operations';
import { type Locator } from '@toa.io/core';
import { type Instance } from './instance.js';
import { type Annotation } from './annotation.js';
export declare function createDependency(sources: Sources, instances: Instance[]): Dependency;
export declare function resolveURIs(locator: Locator): string[];
type Sources = Annotation['sources'];
export {};
