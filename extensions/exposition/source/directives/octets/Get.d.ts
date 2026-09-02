import { Directive } from './Directive.js';
import type { Component } from '@toa.io/core';
import type { Output } from '../../io.js';
import type { Input } from './types.js';
export declare class Get extends Directive {
    readonly targeted = true;
    private readonly options;
    private readonly discovery;
    private storage;
    constructor(options: Options | null, discovery: Promise<Component>);
    apply(storage: string, input: Input): Promise<Output>;
    private get;
    private head;
}
export interface Options {
    meta?: boolean;
}
