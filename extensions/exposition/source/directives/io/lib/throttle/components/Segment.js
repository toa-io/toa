"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Segment = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
/** The value a named route segment was bound to, or nothing when the route has none. */
class Segment {
    name;
    constructor(name) {
        node_assert_1.default.ok(typeof name === 'string', 'Throttle segment must be a string');
        this.name = name;
    }
    get(_, parameters) {
        return parameters.find(({ name }) => name === this.name)?.value ?? '';
    }
}
exports.Segment = Segment;
//# sourceMappingURL=Segment.js.map