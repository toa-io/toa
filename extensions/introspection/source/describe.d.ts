import type { Node } from './model.js';
import type { Manifest } from '@toa.io/norm';
/**
 * Turns a normalized component manifest into the node of the map.
 *
 * Everything here is already normalized by norm: the prototype chain is collapsed,
 * so this is the shape the runtime actually runs.
 */
export declare function describe(manifest: Manifest): Node;
