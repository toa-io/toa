"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = void 0;
const index_js_1 = require("../../HTTP/index.js");
class Input {
    priority = 0;
    statements = [];
    constructor(declarations, create) {
        this.statements = declarations.map((declaration) => new Statement(declaration, create));
    }
    async authorize(identity, context, parameters) {
        context.pipelines.body.push(async (body) => this.check(identity, context, parameters, body));
        return false;
    }
    // eslint-disable-next-line max-params
    async check(identity, context, parameters, body) {
        if (body === undefined || body === null || body.constructor !== Object)
            return body;
        const settled = await Promise.allSettled(this.statements.map(async (statement) => statement.check(identity, context, parameters, body)));
        for (const result of settled)
            if (result.status === 'rejected')
                throw result.reason;
        return body;
    }
}
exports.Input = Input;
class Statement {
    properties;
    directives = [];
    constructor({ prop, ...directives }, create) {
        this.properties = typeof prop === 'string' ? [prop] : prop;
        for (const [name, value] of Object.entries(directives)) {
            const directive = create(name, value);
            this.directives.push(directive);
        }
    }
    // eslint-disable-next-line max-params
    async check(identity, context, parameters, body) {
        const match = this.properties.some((property) => property in body);
        if (!match)
            return;
        for (const directive of this.directives) {
            const authorized = await directive.authorize(identity, context, parameters);
            if (!authorized)
                throw new index_js_1.Forbidden('Input property is not authorized');
        }
    }
}
//# sourceMappingURL=Input.js.map