import * as http from '../../HTTP/index.js';
import type { Directive, Discovery, Identity, Context } from './types.js';
export declare class Incept implements Directive {
    private static readonly schemes;
    private static discovery;
    private static bans;
    private readonly property;
    constructor(property: string, discovery: Discovery);
    static incept(context: Context, id: string): Promise<Identity>;
    authorize(identity: Identity | null): boolean;
    reply(context: Context): http.OutgoingMessage | null;
    settle(context: Context, response: http.OutgoingMessage): Promise<void>;
}
