import { type Parameter } from './RTD/index.js';
import { Query } from './Query.js';
import type { Introspection, Schema } from './Introspection.js';
import type { QueryString } from './Query.js';
import type * as http from './HTTP/index.js';
import type * as syntax from './RTD/syntax/index.js';
import type * as core from '@toa.io/core';
export declare abstract class Mapping {
    protected readonly query: Query;
    abstract readonly queryable: boolean;
    constructor(query: Query);
    static create(query?: syntax.Query | null): Mapping;
    explain(introspection: Introspection): Record<string, Schema> | null;
    protected assign(input: any, qs: QueryString): void;
    abstract fit(input: any, query: http.Query, parameters: Parameter[]): core.Request;
}
export declare function queryable(query?: syntax.Query | null): boolean;
