"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Languages = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const Properties_js_1 = require("./Properties.js");
class Languages extends Properties_js_1.Property {
    constructor(value) {
        node_assert_1.default.ok(Array.isArray(value) && value.length > 0, '`map:languages` must be a non-empty array of strings');
        node_assert_1.default.ok(value.every((language) => typeof language === 'string'), '`map:languages` must be an array of strings');
        super('languages', value);
    }
}
exports.Languages = Languages;
//# sourceMappingURL=Languages.js.map