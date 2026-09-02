import type { Parameter } from '../../../../../RTD/index.js';
import type { Input as Context } from '../../../../../io.js';
import type { Component } from './Component.js';
/** The value a named route segment was bound to, or nothing when the route has none. */
export declare class Segment implements Component {
    private readonly name;
    constructor(name: unknown);
    get(_: Context, parameters: Parameter[]): string;
}
