"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Route = void 0;
/**
 * The route as declared — `/users/:id` — rather than the path a request came in on.
 *
 * A constant per method, resolved when the tree is built, so every request to one
 * route shares a quota however many concrete paths match it.
 */
class Route {
    route;
    constructor(_, route) {
        this.route = route;
    }
    get() {
        return this.route;
    }
}
exports.Route = Route;
//# sourceMappingURL=Route.js.map