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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.split = exports.normalize = void 0;
const node_path_1 = require("node:path");
const schemas = __importStar(require("@toa.io/schemas"));
const protocols_1 = require("./protocols");
function normalize(instances, annotation) {
    schema.validate(annotation);
    mergeDefaults(annotation, instances);
    checkProtocols(annotation);
}
exports.normalize = normalize;
function split(component) {
    const origins = {};
    const properties = {};
    for (const [key, value] of Object.entries(component))
        if (key[0] === '.')
            properties[key] = value;
        else
            origins[key] = value;
    return { origins, properties };
}
exports.split = split;
function mergeDefaults(annotation, instances) {
    for (const instance of instances) {
        const component = annotation[instance.locator.id] ?? {};
        annotation[instance.locator.id] = mergeInstance(component, instance);
    }
}
function mergeInstance(origins, instance) {
    const id = instance.locator.id;
    if (instance.manifest === null)
        return origins;
    for (const [origin, value] of Object.entries(instance.manifest))
        if (origins[origin] === undefined)
            if (value === null)
                throw new Error(`Origin '${origin}' is not defined for '${id}'`);
            else
                origins[origin] = value;
    return origins;
}
function checkProtocols(annotation) {
    for (const component of Object.values(annotation)) {
        const { origins } = split(component);
        const urlSets = Object.values(origins);
        for (const urls of urlSets)
            checkURLs(Array.isArray(urls) ? urls : [urls]);
    }
}
function checkURLs(urls) {
    let id = null;
    for (const url of urls) {
        const protocol = resolveProtocol(url);
        if (id === null)
            id = protocol.id;
        else if (id !== protocol.id)
            throw new Error(`Origin has inconsistent protocols: ${id}, ${protocol.id}`);
    }
}
function resolveProtocol(reference) {
    const url = new URL(reference);
    for (const protocol of protocols_1.protocols)
        if (protocol.protocols.includes(url.protocol))
            return protocol;
    throw new Error(`Protocol '${url.protocol}' is not supported.`);
}
const path = (0, node_path_1.resolve)(__dirname, '../schemas/annotation.cos.yaml');
const schema = schemas.schema(path);
//# sourceMappingURL=annotation.js.map