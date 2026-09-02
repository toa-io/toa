import { Directive } from './Directive.js';
import type { Parameter } from '../../RTD/index.js';
import type { Unit } from './workflows/index.js';
import type { Component } from '@toa.io/core';
import type { Output } from '../../io.js';
import type { Input } from './types.js';
import type { Remotes } from '../../Remotes.js';
export declare class Delete extends Directive {
    readonly targeted = true;
    private readonly workflow?;
    private readonly discovery;
    private storage;
    constructor(options: Options | null, discovery: Promise<Component>, remotes: Remotes);
    apply(storage: string, input: Input, parameters: Parameter[]): Promise<Output>;
    private delete;
    private execute;
}
export interface Options {
    workflow?: Unit[] | Unit;
}
