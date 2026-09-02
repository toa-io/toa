import { type Component } from '@toa.io/core';
import { type Directive, type Identity } from './types.js';
import type { Parameter } from '../../RTD/index.js';
export declare class Role implements Directive {
    static remote: Component | null;
    private readonly roles;
    private readonly discovery;
    private readonly dynamic;
    constructor(roles: string | string[], discovery: Promise<Component>);
    static get(identity: Identity, discovery: Promise<Component>): Promise<string[]>;
    authorize(identity: Identity | null, _: unknown, parameters: Parameter[]): Promise<boolean>;
    private match;
    private substitute;
}
