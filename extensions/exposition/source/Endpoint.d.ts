import { Mapping } from './Mapping.js';
import * as http from './HTTP/index.js';
import type { Introspection } from './Introspection.js';
import type { Remote } from '@toa.io/core';
import type { Remotes } from './Remotes.js';
import type { Context } from './Context.js';
import type * as RTD from './RTD/index.js';
export declare class Endpoint implements RTD.Endpoint {
    private readonly endpoint;
    private readonly mapping;
    private readonly discovery;
    private remote;
    constructor(endpoint: string, mapping: Mapping, discovery: Promise<Remote>);
    call(context: http.Context, parameters: RTD.Parameter[]): Promise<http.OutgoingMessage>;
    explain(parameters: RTD.Parameter[]): Promise<Introspection>;
    close(): Promise<void>;
    private conditionalGet;
    private query;
    private matchVersion;
    private version;
}
export declare class EndpointsFactory implements RTD.EndpointsFactory {
    private readonly remotes;
    constructor(remotes: Remotes);
    create(method: RTD.syntax.Method, context: Context): Endpoint;
}
