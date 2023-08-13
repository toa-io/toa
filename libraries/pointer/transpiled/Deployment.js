"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deployment = void 0;
const naming_1 = require("./naming");
const resolve_1 = require("./resolve");
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
        const name = (0, naming_1.nameVariable)(this.id, selector);
        const { references } = this.resolveRecord(selector);
        const value = references.join(' ');
        return { name, value };
    }
    createSecrets(selector) {
        const varialbes = [];
        const { key, references } = this.resolveRecord(selector);
        if (this.insecure(references))
            return [];
        for (const token of ['username', 'password']) {
            const varName = (0, naming_1.nameVariable)(this.id, selector, token);
            const secretName = (0, naming_1.nameSecret)(this.id, key);
            varialbes.push({
                name: varName,
                secret: {
                    name: secretName,
                    key: token
                }
            });
        }
        return varialbes;
    }
    resolveRecord(selector) {
        return (0, resolve_1.resolveRecord)(this.annotation, selector);
    }
    insecure(references) {
        const reference = references[0];
        const url = new URL(reference);
        return insecureProtocols.includes(url.protocol);
    }
}
exports.Deployment = Deployment;
const insecureProtocols = ['http:', 'https:', 'redis:'];
//# sourceMappingURL=Deployment.js.map