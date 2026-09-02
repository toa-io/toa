import type { syntax } from './RTD/index.js';
import type { Connector, Locator, extensions } from '@toa.io/core';
export declare class Factory implements extensions.Factory {
    private readonly boot;
    constructor(boot: Bootloader);
    tenant(locator: Locator, node: syntax.Node): Connector;
    service(): Connector | null;
}
export type Bootloader = typeof import('@toa.io/boot');
