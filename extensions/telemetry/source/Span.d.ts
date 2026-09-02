import { Connector } from '@toa.io/core';
import type { Task } from 'openspan';
import type { Locator, extensions } from '@toa.io/core';
export declare class Span extends Connector implements extensions.Aspect {
    readonly name = "span";
    private readonly locator;
    private readonly consoles;
    constructor(locator: Locator);
    invoke(operation: string, name: string, attributes: object | Task<unknown>, task?: Task<unknown>): Promise<unknown>;
}
