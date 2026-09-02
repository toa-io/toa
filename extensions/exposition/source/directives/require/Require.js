"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Require = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const Headers_js_1 = require("./Headers.js");
class Require {
    name = 'require';
    mandatory = false;
    create(name, value) {
        node_assert_1.default.ok(name in directives, `Unknown directive: require:${name}`);
        return new directives[name](value);
    }
    preflight(instances, context) {
        for (const instance of instances)
            instance.preflight(context);
        return null;
    }
}
exports.Require = Require;
const directives = {
    header: Headers_js_1.Headers,
    headers: Headers_js_1.Headers
};
//# sourceMappingURL=Require.js.map