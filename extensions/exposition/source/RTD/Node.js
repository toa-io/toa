"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
class Node {
    intermediate;
    forward;
    expiration;
    methods;
    protected;
    routes;
    constructor(routes, methods, properties) {
        this.routes = routes;
        this.methods = methods;
        this.protected = properties.protected;
        this.forward = properties.forward ?? null;
        this.expiration = properties.expiration ?? Infinity;
        this.intermediate = this.routes.findIndex((route) => route.root) !== -1;
        this.sort();
    }
    match(fragments, parameters = []) {
        for (const route of this.routes) {
            const params = parameters.slice();
            const match = route.match(fragments, params);
            if (match !== null)
                return match;
        }
        return null;
    }
    /**
     * Returns the nodes the merged branch has landed on, so that its expiration
     * can later be extended without rebuilding anything.
     */
    merge(node) {
        this.intermediate = node.intermediate;
        const nodes = this.protected ? this.append(node) : this.replace(node);
        this.sort();
        return nodes;
    }
    touch(expiration) {
        if (!this.protected)
            this.expiration = expiration;
    }
    async explain(parameters) {
        const methods = {};
        const explained = Object.entries(this.methods)
            .map(async ([verb, method]) => (methods[verb] = await method.explain(parameters)));
        await Promise.all(explained);
        return methods;
    }
    replace(node) {
        const methods = Object.values(this.methods);
        this.routes = node.routes;
        this.methods = node.methods;
        this.expiration = node.expiration;
        this.forward = node.forward;
        // race condition is really unlikely
        for (const method of methods)
            void method.close();
        return this.nodes();
    }
    append(node) {
        const nodes = [];
        for (const route of node.routes)
            nodes.push(...this.route(route));
        for (const [verb, method] of Object.entries(node.methods))
            this.methods[verb] = method;
        return nodes;
    }
    route(candidate) {
        for (const route of this.routes)
            if (candidate.equals(route))
                return route.merge(candidate);
        this.routes.push(candidate);
        return candidate.node.nodes();
    }
    nodes() {
        const nodes = [this];
        for (const route of this.routes)
            nodes.push(...route.node.nodes());
        return nodes;
    }
    sort() {
        this.routes.sort((a, b) => {
            return a.variables === b.variables
                ? b.segments.length - a.segments.length // routes with more segments should be matched first
                : a.variables - b.variables; // routes with more variables should be matched last
        });
    }
}
exports.Node = Node;
//# sourceMappingURL=Node.js.map