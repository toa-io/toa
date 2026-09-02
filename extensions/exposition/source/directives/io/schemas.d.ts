import { type Schema } from '@toa.io/schemas';
import type { Permissions as InputPermissions } from './Input.js';
import type { Permissions as OutputPermissions } from './Output.js';
import type { Declaration as ThrottleDeclaration } from './lib/throttle/index.js';
import type { Message } from './Message.js';
export declare const message: Schema<Message | Message[]>;
export declare const input: Schema<InputPermissions>;
export declare const output: Schema<OutputPermissions>;
export declare const throttle: Schema<ThrottleDeclaration>;
