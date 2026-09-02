import type { Context, OutgoingMessage } from './HTTP/index.js';
import type { Remotes } from './Remotes.js';
import type { Output } from './io.js';
import type * as RTD from './RTD/index.js';
export declare class Directives implements RTD.Directives {
    private readonly sets;
    /** the span of a stage depends only on the set, so it is built once per route */
    private readonly spans;
    constructor(sets: RTD.DirectiveSet[]);
    preflight(context: Context, parameters: RTD.Parameter[]): Promise<Output>;
    settle(context: Context, response: OutgoingMessage): Promise<void>;
    dispose(): void;
}
export declare class DirectivesFactory implements RTD.DirectiveFactory {
    private readonly remotes;
    private readonly families;
    private readonly mandatory;
    private readonly instances;
    constructor(families: RTD.DirectiveFamily[], remotes: Remotes);
    create(declarations: RTD.syntax.Directive[], route?: string): Directives;
    dispose(): void;
    /** Mandatory families first, in their own order; everything else keeps its own. */
    private rank;
}
export declare const shortcuts: RTD.syntax.Shortcuts;
