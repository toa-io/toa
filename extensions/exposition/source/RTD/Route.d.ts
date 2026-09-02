import { type Segment } from './segment.js';
import { type Match, type Parameter } from './Match.js';
import type { Node } from './Node.js';
export declare class Route {
    readonly root: boolean;
    readonly variables: number;
    readonly segments: Segment[];
    readonly node: Node;
    private readonly wildcard;
    constructor(segments: Segment[], node: Node);
    match(fragments: string[], parameters: Parameter[]): Match | null;
    equals(route: Route): boolean;
    merge(route: Route): Node[];
    private matchNested;
}
