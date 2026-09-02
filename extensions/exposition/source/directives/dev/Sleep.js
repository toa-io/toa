"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sleep = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const promises_1 = require("node:timers/promises");
const openspan_1 = require("openspan");
const index_js_1 = require("../cors/index.js");
const index_js_2 = require("../../HTTP/index.js");
class Sleep {
    static warned = false;
    maximum;
    constructor(value) {
        node_assert_1.default.ok(Number.isInteger(value), '`dev:sleep` directive value must be an integer');
        if (!Sleep.warned) {
            openspan_1.console.warn('Sleep directive is enabled', { maximum: value });
            Sleep.warned = true;
        }
        index_js_1.cors.allow('sleep');
        this.maximum = value;
    }
    async apply(input) {
        const value = input.request.headers.sleep;
        if (value === undefined)
            return null;
        const [min, max] = this.parse(value);
        if (min < 0 || max < 0 || min > max || max > this.maximum)
            throw new index_js_2.BadRequest('Invalid sleep duration');
        const duration = Math.floor(Math.random() * (max - min)) + min;
        await (0, promises_1.setTimeout)(duration);
        return null;
    }
    parse(value) {
        try {
            const pair = JSON.parse(value);
            if (!Array.isArray(pair) || pair.length !== 2)
                throw new Error();
            return pair;
        }
        catch (error) {
            throw new index_js_2.BadRequest('Invalid sleep duration value');
        }
    }
}
exports.Sleep = Sleep;
//# sourceMappingURL=Sleep.js.map