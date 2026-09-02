import { Node } from './Node.js';
import type { Context } from './Context.js';
import type * as syntax from './syntax/index.js';
export declare function createNode(node: syntax.Node, context: Context): Node;
export declare function branchTTL(): number;
