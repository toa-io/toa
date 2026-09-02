import { Connector } from '@toa.io/core';
import type { Declaration } from './annotation.js';
import type { Manifest } from '@toa.io/norm';
import type { Component, Locator, extensions } from '@toa.io/core';
export declare class Factory implements extensions.Factory {
    private readonly boot;
    private readonly options;
    private readonly settings;
    private reporter;
    constructor(boot: Bootloader);
    tenant(locator: Locator, decl: Declaration | null, manifest: Manifest): Connector;
    component(component: Component): Component;
    service(): Connector | null;
    /**
     * `tenant()` runs before any component is created, so settings are warm.
     * A component booted on its own (without a composition) falls back to
     * the environment, with sampling off.
     */
    private resolve;
    private collector;
}
export type Bootloader = typeof import('@toa.io/boot');
