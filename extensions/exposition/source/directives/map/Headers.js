"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Headers = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const index_js_1 = require("../cors/index.js");
const Mapping_js_1 = require("./Mapping.js");
/**
 * Forbidden request header names: the browser sets them itself and a script cannot
 * list them in `Access-Control-Request-Headers`, so there is nothing to advertise
 * or vary on. The value is still read, it just never reaches CORS.
 */
const FORBIDDEN = new Set(['host', 'origin']);
class Headers extends Mapping_js_1.Mapping {
    headers;
    constructor(map) {
        node_assert_1.default.ok(map.constructor === Object, '`map:headers` must be an object');
        node_assert_1.default.ok(Object.values(map).every((value) => typeof value === 'string'), '`map:headers` must be an object with string values');
        super(map);
        this.headers = Object.values(map).filter((header) => !FORBIDDEN.has(header));
        this.headers.forEach((header) => index_js_1.cors.allow(header));
    }
    properties(context) {
        context.pipelines.response.push((response) => {
            response.headers ??= new global.Headers();
            for (const header of this.headers)
                response.headers.append('vary', header);
        });
        return Object.entries(this.value).reduce((properties, [property, header]) => {
            const value = context.request.headers[header];
            if (value !== undefined)
                properties[property] = Array.isArray(value) ? value.join(', ') : value;
            return properties;
        }, {});
    }
}
exports.Headers = Headers;
//# sourceMappingURL=Headers.js.map