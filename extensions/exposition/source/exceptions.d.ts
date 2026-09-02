import { Exception as HTTPException } from './HTTP/index.js';
import type { Exception } from '@toa.io/core';
export declare function rethrow(exception: Exception | HTTPException): void;
