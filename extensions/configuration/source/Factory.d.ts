import { type Connector, type Locator, type extensions } from '@toa.io/core';
import type { Manifest } from './manifest.js';
export declare class Factory implements extensions.Factory {
    private readonly boot;
    private client;
    constructor(boot: Bootloader);
    aspect(locator: Locator, manifest: Manifest): extensions.Aspect;
    service(): Connector;
    private shared;
}
export type Bootloader = typeof import('@toa.io/boot');
