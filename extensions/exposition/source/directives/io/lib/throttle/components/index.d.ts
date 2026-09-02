import type { KeyComponentMethod } from '../Configuration.js';
import type { Component } from './Component.js';
type Constructor<T> = new (options: unknown, route: string) => T;
export declare const Components: Record<KeyComponentMethod, Constructor<Component>>;
export type { Component };
