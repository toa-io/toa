import { Connector } from '@toa.io/core';
import { type Bootloader } from './Factory.js';
import type { Annotation } from './annotation.js';
/** Hosts the introspection components in the explorer process. */
export declare class Composition extends Connector {
    private readonly boot;
    constructor(boot: Bootloader);
    protected open(): Promise<void>;
}
export declare function find(): string[];
/**
 * The extension is predefined, so an application that turns introspection off
 * must not end up with the explorer components — nor with the exposition
 * dependency they bring in.
 */
export declare function components(annotation?: Annotation): Components;
interface Components {
    labels: string[];
    paths: string[];
}
export {};
