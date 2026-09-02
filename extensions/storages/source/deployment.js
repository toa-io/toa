"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV_PREFIX = void 0;
exports.deployment = deployment;
const assert = __importStar(require("node:assert"));
const index_js_1 = require("./providers/index.js");
const Annotation_js_1 = require("./Annotation.js");
exports.ENV_PREFIX = 'TOA_STORAGES';
function deployment(instances, annotation) {
    validate(instances, annotation);
    const value = JSON.stringify(annotation);
    const pointer = { name: exports.ENV_PREFIX, value };
    const secrets = getSecrets(annotation);
    const mounts = getMounts(instances, annotation);
    const dependency = { variables: { global: [pointer, ...secrets] } };
    if (mounts !== null)
        dependency.mounts = mounts;
    return dependency;
}
function validate(instances, annotation) {
    (0, Annotation_js_1.validateAnnotation)(annotation);
    for (const instance of instances) {
        instance.manifest ??= [];
        contains(instance, annotation);
    }
}
function contains(instance, annotation) {
    for (const name of instance.manifest)
        assert.ok(name in annotation, `Missing '${name}' storage annotation ` +
            `declared in '${instance.component.locator.id}'`);
}
function getSecrets(annotation) {
    const secrets = [];
    for (const [name, declaration] of Object.entries(annotation)) {
        const Provider = index_js_1.providers[declaration.provider];
        if (Provider.SECRETS !== undefined)
            // eslint-disable-next-line max-depth
            for (const secret of Provider.SECRETS)
                secrets.push({
                    name: `${exports.ENV_PREFIX}_${name}_${secret.name}`.toUpperCase(),
                    secret: {
                        name: `toa-storages-${name}`,
                        key: secret.name,
                        optional: secret.optional
                    }
                });
    }
    return secrets;
}
function getMounts(instances, annotation) {
    let mounts = null;
    for (const { locator, manifest } of instances)
        for (const name of manifest) {
            const declaration = annotation[name];
            // eslint-disable-next-line max-depth
            if (declaration.provider !== 'fs')
                continue;
            // eslint-disable-next-line max-depth
            if (declaration.claim !== undefined) {
                mounts ??= {};
                mounts[locator.label] ??= [];
                mounts[locator.label].push({
                    name,
                    path: declaration.path,
                    claim: declaration.claim
                });
            }
        }
    return mounts;
}
//# sourceMappingURL=deployment.js.map