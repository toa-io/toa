/// <reference types="node" />
import { type Readable } from 'node:stream';
import { type Context } from './types';
export declare function effect(key: string, context: Context): Promise<Readable>;
