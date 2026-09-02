import { type Component } from './components/index.js';
import { type Condition } from './conditions/index.js';
import type { KeyComponent, KeyCondition } from './Configuration.js';
import type { Parameter } from '../../../../RTD/index.js';
import type { Input as Context, Output } from '../../../../io.js';
export declare class Keys {
    private readonly components;
    private readonly conditions?;
    constructor(components: Component[], conditions?: Condition[]);
    static create(componentRules: KeyComponent[], conditionRules?: KeyCondition[], route?: string): Keys;
    get(context: Context, parameters?: Parameter[]): string;
    matches(input: Context, output: Output): boolean;
}
