import type { URIMap } from './Deployment.js';
export declare function normalize(declaration: Declaration): URIMap;
export type Declaration = string | string[] | Record<string, string | string[]> | undefined;
