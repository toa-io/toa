import { Connector } from '@toa.io/core';
import type { Bootloader } from './Factory.js';
/** Hosts the values component in the service process. */
export declare class Composition extends Connector {
    private readonly boot;
    constructor(boot: Bootloader);
    protected open(): Promise<void>;
}
export declare function components(): Components;
interface Components {
    labels: string[];
    paths: string[];
}
export {};
