"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const Control_js_1 = require("./Control.js");
const Exact_js_1 = require("./Exact.js");
class Cache {
    name = 'cache';
    mandatory = true;
    create(name, value) {
        const Class = constructors[name];
        if (Class === undefined)
            throw new Error(`Directive 'cache:${name}' is not implemented`);
        return new Class(value);
    }
    preflight() {
        return null;
    }
    async settle(directives, context, response) {
        const method = context.request.method;
        if (method !== 'GET' && method !== 'HEAD')
            return;
        const directive = directives[0];
        response.headers ??= new Headers();
        if (directive === undefined) {
            if (context.identity !== null && !Control_js_1.Control.disabled(response.headers)) {
                response.headers.set('cache-control', 'private');
                response.headers.append('vary', 'authorization');
            }
        }
        else
            directive.set(context, response.headers);
    }
}
exports.Cache = Cache;
const constructors = {
    control: Control_js_1.Control,
    exact: Exact_js_1.Exact
};
//# sourceMappingURL=Cache.js.map