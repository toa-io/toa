"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Span = void 0;
const core_1 = require("@toa.io/core");
const openspan_1 = require("openspan");
class Span extends core_1.Connector {
    name = 'span';
    locator;
    consoles = {};
    constructor(locator) {
        super();
        this.locator = locator;
    }
    // eslint-disable-next-line max-params
    async invoke(operation, name, attributes, task) {
        this.consoles[operation] ??= openspan_1.console.fork({
            namespace: this.locator.namespace,
            component: this.locator.name,
            operation
        });
        const output = this.consoles[operation];
        if (typeof attributes === 'function')
            return await output.span(name, attributes);
        else
            return await output.span(name, attributes, task);
    }
}
exports.Span = Span;
//# sourceMappingURL=Span.js.map