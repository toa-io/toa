import type { Node } from './Node.js';
import type { Match } from './Match.js';
import type { DirectiveFactory } from './Directives.js';
import type { EndpointsFactory } from './Endpoint.js';
import type * as syntax from './syntax/index.js';
export declare class Tree {
    private readonly root;
    private readonly trunk;
    private readonly endpoints;
    private readonly directives;
    constructor(node: syntax.Node, endpoints: EndpointsFactory, directives: DirectiveFactory);
    match(path: string): Match | null;
    merge(node: syntax.Node, extension: unknown): Node[];
    /**
     * Extends the expiration of an already merged branch, leaving its endpoints
     * and their remotes intact.
     */
    refresh(nodes: Node[]): void;
    dispose(): void;
    private createNode;
}
