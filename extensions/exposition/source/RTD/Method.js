"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Method = void 0;
class Method {
    endpoint;
    directives;
    introspection = null;
    introspecting = null;
    constructor(endpoint, directives) {
        this.endpoint = endpoint;
        this.directives = directives;
    }
    async explain(parameters) {
        if (this.introspection !== null)
            return this.introspection;
        if (this.introspecting === null)
            // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
            this.introspecting = this.endpoint?.explain(parameters);
        this.introspection = await this.introspecting;
        return this.introspection;
    }
    async close() {
        await this.endpoint?.close();
    }
}
exports.Method = Method;
//# sourceMappingURL=Method.js.map