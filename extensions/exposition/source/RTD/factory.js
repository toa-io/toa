"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNode = createNode;
exports.branchTTL = branchTTL;
const const_js_1 = require("../const.js");
const Node_js_1 = require("./Node.js");
const Route_js_1 = require("./Route.js");
const segment_js_1 = require("./segment.js");
const Method_js_1 = require("./Method.js");
function createNode(node, context) {
    if (node.isolated === true)
        context.directives.stack = node.directives;
    else
        context.directives.stack = node.directives.concat(context.directives.stack);
    const routes = node.routes.map((route) => createRoute(route, context));
    const methods = {};
    for (const method of node.methods)
        methods[method.verb] = createMethod(method, context);
    const protect = node.protected ?? context.protected;
    const properties = {
        protected: protect,
        forward: node.forward,
        expiration: protect ? Infinity : Date.now() + branchTTL()
    };
    return new Node_js_1.Node(routes, methods, properties);
}
function branchTTL() {
    const value = process.env.__TESTING_EXPOSITION_BRANCH_TTL;
    if (value === undefined || value === '')
        return const_js_1.BRANCH_TTL;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : const_js_1.BRANCH_TTL;
}
function createRoute(route, context) {
    const stack = context.directives.stack.slice();
    const path = context.path;
    const segments = (0, segment_js_1.segment)(route.path);
    context.path = join(path, route.path);
    const node = createNode(route.node, context);
    context.directives.stack = stack; // restore
    context.path = path;
    return new Route_js_1.Route(segments, node);
}
function join(base, path) {
    // '/one/' and '/two/' would otherwise read as '/one//two/'
    return (base + path).replace(/\/+/g, '/').replace(/(.)\/$/, '$1');
}
function createMethod(method, context) {
    const stack = method.directives.concat(context.directives.stack);
    const directives = context.directives.factory.create(stack, context.path);
    const endpoint = method.mapping?.endpoint === undefined
        ? null
        : context.endpoints.create(method, context);
    return new Method_js_1.Method(endpoint, directives);
}
//# sourceMappingURL=factory.js.map