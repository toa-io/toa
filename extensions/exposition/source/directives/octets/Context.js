"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const Directive_js_1 = require("./Directive.js");
class Context extends Directive_js_1.Directive {
    targeted = false;
    storage;
    constructor(value) {
        super();
        node_assert_1.default.ok(typeof value === 'string', 'Directive \'octets:context\' must must be a string');
        this.storage = value;
    }
    async apply() {
        return null;
    }
}
exports.Context = Context;
//# sourceMappingURL=Context.js.map