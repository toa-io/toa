import type { Component } from './Component.js';
/**
 * The route as declared — `/users/:id` — rather than the path a request came in on.
 *
 * A constant per method, resolved when the tree is built, so every request to one
 * route shares a quota however many concrete paths match it.
 */
export declare class Route implements Component {
    private readonly route;
    constructor(_: unknown, route: string);
    get(): string;
}
