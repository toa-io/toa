import { Connector } from '@toa.io/core';
import type { Console, ConsoleOptions } from 'openspan';
import type { Locator, extensions } from '@toa.io/core';
export declare class Logs extends Connector implements extensions.Aspect {
    readonly name = "logs";
    private readonly locator;
    private readonly console;
    private readonly consoles;
    constructor(locator: Locator, options: LogsOptions);
    invoke(operation: string, fork: 'fork', context: object): Console;
}
export type LogsOptions = Pick<ConsoleOptions, 'level'>;
