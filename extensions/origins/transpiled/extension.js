"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROPERTIES_SUFFIX = exports.ENV_PREFIX = exports.ID_PREFIX = exports.manifest = exports.deployment = void 0;
const msgpackr_1 = require("msgpackr");
const pointer_1 = require("@toa.io/pointer");
const generic_1 = require("@toa.io/generic");
const annotation_1 = require("./annotation");
const manifest_1 = require("./manifest");
function deployment(instances, annotation = {}) {
    (0, annotation_1.normalize)(instances, annotation);
    const variables = {};
    for (const instance of instances) {
        const component = annotation[instance.locator.id];
        const { origins, properties } = (0, annotation_1.split)(component);
        const instanceVariables = createInstanceVariables(instance, origins);
        const propertiesVariable = createPropertiesVariable(instance.locator, properties);
        (0, generic_1.merge)(variables, instanceVariables);
        (0, generic_1.merge)(variables, propertiesVariable);
    }
    return { variables };
}
exports.deployment = deployment;
function manifest(manifest) {
    (0, manifest_1.validate)(manifest);
    return manifest;
}
exports.manifest = manifest;
function createInstanceVariables(instance, origins) {
    if (instance.manifest === null)
        return {};
    const label = instance.locator.label;
    const id = exports.ID_PREFIX + label;
    const selectors = Object.keys(instance.manifest);
    const request = { group: label, selectors };
    return (0, pointer_1.createVariables)(id, origins, [request]);
}
function createPropertiesVariable(locator, properties) {
    const name = exports.ENV_PREFIX + locator.uppercase + exports.PROPERTIES_SUFFIX;
    const value = (0, msgpackr_1.encode)(properties).toString('base64');
    return {
        [locator.label]: [
            { name, value }
        ]
    };
}
exports.ID_PREFIX = 'origins-';
exports.ENV_PREFIX = 'TOA_ORIGINS_';
exports.PROPERTIES_SUFFIX = '__PROPERTIES';
//# sourceMappingURL=extension.js.map