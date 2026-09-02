"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deployment = void 0;
const naming_js_1 = require("./naming.js");
const resolve_js_1 = require("./resolve.js");
class Deployment {
    id;
    annotation;
    constructor(id, annotation) {
        this.id = id;
        this.annotation = annotation;
    }
    export(requests) {
        const variables = {};
        for (const request of requests)
            variables[request.group] = this.createVariables(request.selectors);
        return variables;
    }
    createVariables(selectors) {
        const variables = [];
        for (const selector of selectors) {
            const variable = this.createVariable(selector);
            const secrets = this.createSecrets(selector);
            variables.push(variable, ...secrets);
        }
        return variables;
    }
    createVariable(selector) {
        const name = (0, naming_js_1.nameVariable)(this.id, selector);
        const { references } = this.resolveRecord(selector);
        const value = references.join(' ');
        return { name, value };
    }
    createSecrets(selector) {
        const variables = [];
        const { key, references } = this.resolveRecord(selector);
        const protocol = new URL(references[0]).protocol;
        if (insecureProtocols.includes(protocol))
            return [];
        for (const token of ['username', 'password']) {
            const varName = (0, naming_js_1.nameVariable)(this.id, selector, token);
            const secretName = (0, naming_js_1.nameSecret)(this.id, key);
            variables.push({
                name: varName,
                secret: {
                    name: secretName,
                    key: token
                }
            });
        }
        return variables;
    }
    resolveRecord(selector) {
        return (0, resolve_js_1.resolveRecord)(this.annotation, selector);
    }
}
exports.Deployment = Deployment;
const insecureProtocols = ['http:', 'https:', 'redis:'];
//# sourceMappingURL=Deployment.js.map