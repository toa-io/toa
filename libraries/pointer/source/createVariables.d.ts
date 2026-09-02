import { type Request } from './Deployment.js';
import type { Variables } from '@toa.io/operations';
import type { Declaration } from './annotation.js';
export declare function createVariables(id: string, declaration: Declaration, requests: Request[]): Variables;
