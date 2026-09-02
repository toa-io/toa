import { type Node } from './types.js';
export declare function parse(input: object, shortcuts?: Shortcuts): Node;
export declare function createNode(): Node;
export type Shortcuts = Map<string, string>;
