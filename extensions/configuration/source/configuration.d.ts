import { type Locator } from '@toa.io/core';
import type { Manifest } from './manifest.js';
/** The variable is set, so the values service is not consulted. */
export declare function overridden(locator: Locator): boolean;
/** The variable, the manifest defaults, then the schema. */
export declare function local(locator: Locator, manifest: Manifest): Node;
/** A copy of the value with the schema applied and the secrets substituted. */
export declare function fit(raw: object, manifest: Manifest): Node;
export type Node = Record<string, unknown>;
