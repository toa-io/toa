"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Faulty = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const index_js_1 = require("../../HTTP/index.js");
const index_js_2 = require("../cors/index.js");
class Faulty {
    static warned = false;
    probability;
    constructor(probability) {
        node_assert_1.default.ok(typeof probability === 'number', '`dev:faulty` directive value must be a number');
        node_assert_1.default.ok(probability > 0 && probability <= 1, '`dev:faulty` directive value must be in the range (0, 1]');
        this.probability = probability;
        index_js_2.cors.allow('faulty');
    }
    async apply() {
        if (Math.random() > this.probability)
            return null;
        throw new index_js_1.ServiceUnavailable();
    }
}
exports.Faulty = Faulty;
//# sourceMappingURL=Faulty.js.map