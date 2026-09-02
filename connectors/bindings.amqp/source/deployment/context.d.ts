import { type Dependency } from '@toa.io/operations';
import { type Locator } from '@toa.io/core';
import { type Annotation } from './annotation.js';
export declare function createDependency(context: Context): Dependency;
export declare function resolveURIs(locator: Locator): string[];
type Context = Annotation['context'];
export {};
