"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferMapping = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const Mapping_js_1 = require("./Mapping.js");
class BufferMapping extends Mapping_js_1.Mapping {
    constructor(property) {
        node_assert_1.default.ok(typeof property === 'string', '`map:buffer` must be a string');
        super(property);
    }
    async properties(context) {
        return { [this.value]: (await context.buffer()).toString('utf8') };
    }
}
exports.BufferMapping = BufferMapping;
//# sourceMappingURL=Buffer.js.map