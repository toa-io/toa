import * as http from './HTTP/index.js';
import { type Parameter } from './RTD/index.js';
import type { Introspection, Schema } from './Introspection.js';
import type * as syntax from './RTD/syntax/index.js';
import type * as core from '@toa.io/core';
export declare class Query {
    readonly parameterized: boolean;
    private readonly query;
    private readonly closed;
    private readonly prepend;
    private readonly queryable;
    private readonly searchable;
    constructor(query: syntax.Query);
    fit(query: http.Query, parameters: Parameter[]): QueryString;
    explain(introspection: Introspection): Record<string, Schema> | null;
    private split;
    private fitCriteria;
    private fitRanges;
    private fitSort;
}
export interface QueryString {
    query: core.Query | null;
    parameters: Record<string, string> | null;
}
