import { type Request } from './Deployment';
import type { Variables } from '@toa.io/operations';
import type { Declaration } from './annotation';
export declare function createVariables(id: string, declaration: Declaration, requests: Request[]): Variables;
