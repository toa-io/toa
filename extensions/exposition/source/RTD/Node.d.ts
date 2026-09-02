import { type Route } from './Route.js';
import { type Methods } from './Method.js';
import { type Match, type Parameter } from './Match.js';
export declare class Node {
    intermediate: boolean;
    forward: string | null;
    expiration: number;
    methods: Methods;
    private readonly protected;
    private routes;
    constructor(routes: Route[], methods: Methods, properties: Properties);
    match(fragments: string[], parameters?: Parameter[]): Match | null;
    /**
     * Returns the nodes the merged branch has landed on, so that its expiration
     * can later be extended without rebuilding anything.
     */
    merge(node: Node): Node[];
    touch(expiration: number): void;
    explain(parameters: Parameter[]): Promise<Record<string, unknown>>;
    private replace;
    private append;
    private route;
    private nodes;
    private sort;
}
export interface Properties {
    protected: boolean;
    forward?: string;
    expiration?: number;
}
