import { Connector } from '@toa.io/core';
import type { Locator, extensions } from '@toa.io/core';
export declare class Aspect extends Connector implements extensions.Aspect {
    readonly name = "fetch";
    private readonly locator;
    private readonly consoles;
    constructor(locator: Locator);
    invoke(operation: string, input: RequestInfo | URL, init?: FetchInit): Promise<Response>;
    private output;
}
export interface FetchInit extends RequestInit {
    retry?: RetryOptions;
}
export interface RetryOptions {
    attempts: number;
    expected?: number[];
    delay?: number;
    factor?: number;
}
