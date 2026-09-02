"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Factory = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const openspan_1 = require("openspan");
const index_js_1 = require("./providers/index.js");
const Storage_js_1 = require("./Storage.js");
const Aspect_js_1 = require("./Aspect.js");
const deployment_js_1 = require("./deployment.js");
const Annotation_js_1 = require("./Annotation.js");
class Factory {
    annotation;
    constructor() {
        const env = process.env[deployment_js_1.ENV_PREFIX];
        node_assert_1.default.ok(env !== undefined, `${deployment_js_1.ENV_PREFIX} is not defined`);
        this.annotation = JSON.parse(env);
        (0, Annotation_js_1.validateAnnotation)(this.annotation);
    }
    aspect() {
        const storages = this.createStorages();
        return new Aspect_js_1.Aspect(storages);
    }
    createStorages() {
        const storages = {};
        for (const [name, declaration] of Object.entries(this.annotation))
            storages[name] = this.createStorage(name, declaration);
        return storages;
    }
    createStorage(name, declaration) {
        const { provider: id, ...options } = declaration;
        const Provider = index_js_1.providers[id];
        const secrets = this.resolveSecrets(name, Provider);
        const provider = new Provider(options, secrets);
        openspan_1.console.debug('Storage created', {
            name,
            provider: id,
            ...(provider.root === undefined ? undefined : { root: provider.root })
        });
        return new Storage_js_1.Storage(provider, { name, provider: id });
    }
    resolveSecrets(storageName, Class) {
        if (Class.SECRETS === undefined)
            return {};
        const secrets = {};
        for (const secret of Class.SECRETS) {
            const variable = `${deployment_js_1.ENV_PREFIX}_${storageName}_${secret.name}`.toUpperCase();
            const value = process.env[variable];
            node_assert_1.default.ok(secret.optional === true || value !== undefined, `'${variable}' is not defined`);
            secrets[secret.name] = value;
        }
        return secrets;
    }
}
exports.Factory = Factory;
//# sourceMappingURL=Factory.js.map