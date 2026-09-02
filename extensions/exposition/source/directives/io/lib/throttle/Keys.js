"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keys = void 0;
const node_crypto_1 = require("node:crypto");
const index_js_1 = require("./components/index.js");
const index_js_2 = require("./conditions/index.js");
const NONE = [];
class Keys {
    components;
    conditions;
    constructor(components, conditions) {
        this.components = components;
        this.conditions = conditions;
    }
    static create(componentRules, conditionRules, route = '') {
        const components = componentRules.map((rule) => new index_js_1.Components[rule.method](rule.options, route));
        const conditions = conditionRules?.map((rule) => new index_js_2.Conditions[rule.method](rule.options));
        return new this(components, conditions);
    }
    get(context, parameters = NONE) {
        const hash = (0, node_crypto_1.createHash)('sha256');
        for (const component of this.components)
            hash.update(component.get(context, parameters));
        return hash.digest('hex');
    }
    matches(input, output) {
        return this.conditions?.some((condition) => !condition.match(input, output)) !== true;
    }
}
exports.Keys = Keys;
//# sourceMappingURL=Keys.js.map