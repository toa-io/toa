/// <reference types="node" />
import { Duplex, PassThrough } from 'node:stream';
import { type Context } from '../types';
export declare function addStream(key: string, map: Record<string, Duplex>): void;
export declare function pipe(context: Context, key: string): PassThrough;
