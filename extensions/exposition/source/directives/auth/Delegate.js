"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delegate = void 0;
const index_js_1 = require("../../HTTP/index.js");
const Role_js_1 = require("./Role.js");
class Delegate {
    property;
    discovery;
    constructor(property, discovery) {
        this.property = property;
        this.discovery = discovery;
    }
    async authorize(identity, context) {
        if (identity === null)
            return false;
        identity.roles ??= await Role_js_1.Role.get(identity, this.discovery);
        context.pipelines.body.push((body) => this.embed(body, identity));
        return true;
    }
    embed(body, identity) {
        if (body === undefined)
            body = {};
        check(body);
        body[this.property] = structuredClone(identity);
        return body;
    }
}
exports.Delegate = Delegate;
function check(body) {
    if (typeof body !== 'object' || body === null)
        throw new index_js_1.BadRequest('Invalid request body');
}
//# sourceMappingURL=Delegate.js.map