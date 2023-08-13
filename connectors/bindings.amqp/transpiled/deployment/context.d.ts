import { type Dependency } from '@toa.io/operations';
import { type Locator } from '@toa.io/core';
import { type Annotation } from './annotation';
export declare function createDependency(context: Context): Dependency;
export declare function resolveURIs(locator: Locator): Promise<string[]>;
type Context = Annotation['context'];
export {};
