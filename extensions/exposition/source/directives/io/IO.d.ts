import type * as http from '../../HTTP/index.js';
import type { Parameter, DirectiveFamily } from '../../RTD/index.js';
import type { Remotes } from '../../Remotes.js';
import type { Directive } from './Directive.js';
export declare class IO implements DirectiveFamily<Directive> {
    readonly name = "io";
    readonly mandatory = true;
    /** Throttling reconciles through a component, because only a component has an atom aspect. */
    private sync;
    create(name: string, value: unknown, remotes: Remotes, route: string): Directive;
    preflight(directives: Directive[], context: http.Context, parameters: Parameter[]): null;
    settle(directives: Directive[], context: http.Context, output: http.OutgoingMessage): void;
    /**
     * The ticker belongs to the family rather than to any route's directives, and the
     * factory disposes every route it made — so this runs once per route at shutdown,
     * and disposing an already stopped ticker is what makes that harmless.
     */
    dispose(): void;
}
