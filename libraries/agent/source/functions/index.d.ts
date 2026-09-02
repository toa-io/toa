import { email } from './email.js';
import { password } from './password.js';
import type { Captures } from '../Captures.js';
export declare const functions: Functions;
type Fn = (this: Captures, value: string, ...args: string[]) => string;
export type Functions = Record<string, Fn>;
export { email, password };
