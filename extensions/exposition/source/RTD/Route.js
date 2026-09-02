"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Route = void 0;
class Route {
    root;
    variables = 0;
    segments;
    node;
    wildcard = false;
    constructor(segments, node) {
        this.root = segments.length === 0;
        this.segments = segments;
        this.node = node;
        for (const segment of segments)
            if (segment.fragment === null) {
                this.variables++;
                this.wildcard ||= segment.wildcard === true;
            }
    }
    match(fragments, parameters) {
        if (Date.now() >= this.node.expiration)
            return null;
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            if (segment.fragment !== null && segment.fragment !== fragments[i])
                return null;
            if (segment.fragment === null && segment.placeholder !== null)
                parameters.push({ name: segment.placeholder, value: fragments[i] });
            if (segment.fragment === null && segment.wildcard === true)
                parameters.push({ name: '**', value: fragments.slice(this.segments.length - 1).join('/') });
        }
        const exact = this.segments.length === fragments.length;
        if ((exact && !this.node.intermediate) || this.wildcard)
            return { node: this.node, parameters };
        else
            return this.matchNested(fragments, parameters);
    }
    equals(route) {
        if (route.segments.length !== this.segments.length)
            return false;
        for (let i = 0; i < this.segments.length; i++)
            if (this.segments[i].fragment !== route.segments[i].fragment)
                return false;
        return true;
    }
    merge(route) {
        return this.node.merge(route.node);
    }
    matchNested(fragments, parameters) {
        fragments = fragments.slice(this.segments.length);
        return this.node.match(fragments, parameters);
    }
}
exports.Route = Route;
//# sourceMappingURL=Route.js.map