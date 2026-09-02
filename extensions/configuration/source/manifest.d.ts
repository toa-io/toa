import { type Node } from './configuration.js';
export declare function manifest(manifest: Manifest): Manifest;
export interface Manifest {
    schema: object;
    defaults?: Node;
}
