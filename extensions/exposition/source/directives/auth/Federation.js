"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Federation = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
class Federation {
    matchers;
    constructor(options) {
        this.matchers = Object.entries(options)
            .map(([key, value]) => [key, toMatcher(value)]);
        node_assert_1.default.ok(this.matchers.length > 0, '`auth:claims` requires at least one property defined');
    }
    authorize(identity, context, parameters) {
        if (identity === null || !('claims' in identity))
            return false;
        const claims = identity.claims;
        for (const [key, match] of this.matchers)
            if (!match(claims[key], context, parameters))
                return false;
        return true;
    }
}
exports.Federation = Federation;
function toMatcher(expression) {
    if (expression.startsWith(':')) {
        const key = expression.slice(1);
        if (key === 'authority')
            return (value, context) => matches(value, context[key]);
        if (key === 'domain')
            return (value, context) => {
                return Array.isArray(value)
                    ? value.some((iss) => codomain(iss, context))
                    : codomain(value, context);
            };
        throw new Error('Unknown `auth:claims` syntax: ' + expression);
    }
    if (expression.startsWith('/:')) {
        const name = expression.slice(2);
        return (value, _, parameters) => parameters
            .some((parameter) => parameter.name === name && matches(value, parameter.value));
    }
    return (value) => matches(value, expression);
}
function matches(value, reference) {
    return Array.isArray(value)
        ? value.includes(reference)
        : value === reference;
}
function codomain(iss, context) {
    const hostname = new URL(iss).hostname;
    const dot = hostname.indexOf('.');
    const basename = dot === -1 ? hostname : hostname.slice(dot);
    return context.authority.slice(-basename.length) === basename;
}
//# sourceMappingURL=Federation.js.map