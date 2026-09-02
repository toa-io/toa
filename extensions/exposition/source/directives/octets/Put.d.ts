import { Directive } from './Directive.js';
import type { Parameter } from '../../RTD/index.js';
import type { Unit } from './workflows/index.js';
import type { Remotes } from '../../Remotes.js';
import type { Component } from '@toa.io/core';
import type { Output } from '../../io.js';
import type { Input } from './types.js';
export declare class Put extends Directive {
    readonly targeted = false;
    private readonly location?;
    private readonly accept?;
    private readonly limit;
    private readonly limitString;
    private readonly trust?;
    private readonly workflow?;
    private readonly discovery;
    private storage;
    constructor(options: Options | null, discovery: Promise<Component>, remotes: Remotes);
    apply(storage: string, input: Input, parameters: Parameter[]): Promise<Output>;
    private reply;
    private execute;
    private throw;
}
export interface Options {
    location?: string;
    accept?: string | string[];
    limit?: string;
    workflow?: Unit[] | Unit;
    trust?: string[];
}
