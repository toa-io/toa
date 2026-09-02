import type { Context, Directive, Identity } from './types.js';
import type { Component } from '@toa.io/core';
export declare class Delegate implements Directive {
    private readonly property;
    private readonly discovery;
    constructor(property: string, discovery: Promise<Component>);
    authorize(identity: Identity | null, context: Context): Promise<boolean>;
    private embed;
}
