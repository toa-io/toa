"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Development = void 0;
const Stub_js_1 = require("./Stub.js");
const Throw_js_1 = require("./Throw.js");
const Sleep_js_1 = require("./Sleep.js");
const Faulty_js_1 = require("./Faulty.js");
class Development {
    name = 'dev';
    mandatory = false;
    create(name, value) {
        const Class = constructors[name];
        if (Class === undefined)
            throw new Error(`Directive 'dev:${name}' is not implemented`);
        return new Class(value);
    }
    async preflight(directives, input) {
        let output = null;
        for (const directive of directives) {
            const out = await directive.apply(input);
            if (out !== null)
                if (output !== null)
                    throw new Error('`dev` directives ambiguous output');
                else
                    output = out;
        }
        return output;
    }
}
exports.Development = Development;
const constructors = {
    stub: Stub_js_1.Stub,
    throw: Throw_js_1.Throw,
    sleep: Sleep_js_1.Sleep,
    faulty: Faulty_js_1.Faulty
};
//# sourceMappingURL=Development.js.map