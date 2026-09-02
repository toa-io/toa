import { type Component, Connector } from '@toa.io/core';
import { type Routes } from './Routes.js';
export declare class Realtime extends Connector {
    private readonly discovery;
    private streams;
    constructor(routes: Routes, discovery: () => Promise<Component>);
    protected open(): Promise<void>;
    protected dispose(): void;
    private push;
    private deliver;
}
