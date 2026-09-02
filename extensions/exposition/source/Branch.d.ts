import type * as RTD from './RTD/syntax/index.js';
import type { Node } from './RTD/index.js';
export interface Branch {
    namespace: string;
    component: string;
    isolated: boolean;
    node: RTD.Node;
    version: string;
    /**
     * When the tenant that announced it started, by its own clock. A replica on its way
     * out announces the same component with an older stamp than the one replacing it, and
     * that is what tells the two apart when their versions differ.
     */
    timestamp: number;
}
/** A branch the gateway has merged, and the tenant it came from. */
export interface Exposed {
    version: string;
    /** The start time of the tenant this branch came from. */
    timestamp: number;
    nodes: Node[];
}
/**
 * What to do with an announcement about a component that already has a branch exposed.
 *
 * - `refresh`: the same version, so its expiration is extended and its endpoints left alone
 * - `superseded`: it came from a tenant that started before the one exposed now
 * - `merge`: everything else
 */
export declare function decide(exposed: Exposed, branch: Branch): Decision;
export type Decision = 'merge' | 'refresh' | 'superseded';
