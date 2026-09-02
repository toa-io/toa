import * as http from '../../HTTP/index.js';
import type { Output } from '../../io.js';
import type { Remotes } from '../../Remotes.js';
import type { Parameter, DirectiveFamily } from '../../RTD/index.js';
import type { Directive, Extension, Context } from './types.js';
export declare class Authorization implements DirectiveFamily<Directive, Extension> {
    readonly depends: string[];
    readonly name: string;
    readonly mandatory: boolean;
    private readonly schemes;
    private readonly discovery;
    private tokens;
    private bans;
    create(name: string, value: any, remotes: Remotes): Directive;
    arrange(directives: Directive[]): void;
    preflight(directives: Directive[], context: Context, parameters: Parameter[]): Promise<Output>;
    settle(directives: Directive[], context: Context, response: http.OutgoingMessage): Promise<void>;
    private resolve;
    private permitted;
    private banned;
}
