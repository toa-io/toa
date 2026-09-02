"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Claims = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const Mapping_js_1 = require("./Mapping.js");
class Claims extends Mapping_js_1.Mapping {
    discovery;
    federation = null;
    constructor(map, remotes) {
        node_assert_1.default.ok(map.constructor === Object, '`map:claims` must be an object');
        node_assert_1.default.ok(Object.values(map).every((value) => typeof value === 'string'), '`map:claims ` must be an object with string values');
        super(map, remotes);
        this.discovery = remotes.discover('identity', 'federation');
    }
    async properties(context) {
        const authentication = context.request.headers.authorization;
        if (authentication === undefined)
            return null;
        const claims = await this.claims(authentication);
        if (claims === null)
            return null;
        return Object.entries(this.value).reduce((properties, [property, claim]) => {
            const value = claims[claim];
            if (value !== undefined)
                properties[property] = value;
            return properties;
        }, {});
    }
    async claims(authentication) {
        const [scheme, credentials] = authentication.split(' ');
        if (scheme !== 'Bearer' || credentials === undefined)
            return null;
        this.federation ??= await this.discovery;
        const claims = await this.federation.invoke('decode', { input: credentials });
        if (claims instanceof Error)
            return null;
        return claims;
    }
}
exports.Claims = Claims;
//# sourceMappingURL=Claims.js.map