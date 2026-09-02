import { Directive } from './Directive.js';
import type { Unit } from './workflows/index.js';
import type { Input } from './types.js';
import type { Component } from '@toa.io/core';
import type { Output } from '../../io.js';
import type { Remotes } from '../../Remotes.js';
import type { Parameter } from '../../RTD/index.js';
export declare class WorkflowDirective extends Directive {
    readonly targeted = true;
    private readonly workflow;
    private readonly discovery;
    private storage;
    constructor(units: Unit[] | Unit, discovery: Promise<Component>, remotes: Remotes);
    apply(storage: string, input: Input, parameters: Parameter[]): Promise<Output>;
}
