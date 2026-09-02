"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Flow = void 0;
const Fetch_js_1 = require("./Fetch.js");
const Compose_js_1 = require("./Compose.js");
class Flow {
    name = 'flow';
    mandatory = false;
    create(name, value, remotes) {
        const Class = constructors[name];
        if (Class === undefined)
            throw new Error(`Directive '${this.name}:${name}' is not implemented`);
        return new Class(value, remotes);
    }
    async preflight(directives, input, parameters) {
        for (const directive of directives) {
            if (directive.attach !== undefined)
                directive.attach(input);
            if (directive.apply === undefined)
                continue;
            const output = await directive.apply(input, parameters);
            if (output !== null)
                return output;
        }
        return null;
    }
}
exports.Flow = Flow;
const constructors = {
    fetch: Fetch_js_1.Fetch,
    compose: Compose_js_1.Compose
};
//# sourceMappingURL=Flow.js.map