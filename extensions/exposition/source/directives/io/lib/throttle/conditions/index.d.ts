import type { KeyConditionMethod } from '../Configuration.js';
import type { Condition } from './Condition.js';
type Constructor<T> = new (options: unknown) => T;
export declare const Conditions: Record<KeyConditionMethod, Constructor<Condition>>;
export type { Condition };
