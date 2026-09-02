"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Segments = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const Mapping_js_1 = require("./Mapping.js");
class Segments extends Mapping_js_1.Mapping {
    constructor(map) {
        node_assert_1.default.ok(map.constructor === Object, '`map:segments` must be an object');
        node_assert_1.default.ok(Object.values(map).every((value) => typeof value === 'string'), '`map:segments ` must be an object with string values');
        super(map);
    }
    properties(_, parameters) {
        return Object.entries(this.value).reduce((properties, [property, parameter]) => {
            const cut = parameter[0] === '~';
            if (cut)
                parameter = parameter.slice(1);
            const index = parameters.findIndex(({ name }) => name === parameter);
            node_assert_1.default.ok(index > -1, `Route parameter '${parameter}' is missing`);
            properties[property] = parameters[index].value;
            if (cut)
                parameters.splice(index, 1);
            return properties;
        }, {});
    }
}
exports.Segments = Segments;
//# sourceMappingURL=Segments.js.map