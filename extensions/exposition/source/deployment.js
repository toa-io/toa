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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployment = deployment;
const node_assert_1 = __importDefault(require("node:assert"));
const schemas = __importStar(require("./schemas.js"));
const Directive_js_1 = require("./Directive.js");
const Composition_js_1 = require("./Composition.js");
const index_js_1 = require("./RTD/syntax/index.js");
const index_js_2 = require("./HTTP/index.js");
function deployment(_, annotation) {
    node_assert_1.default.ok(annotation !== undefined, 'Exposition context annotation is required');
    schemas.annotation.validate(annotation);
    const labels = (0, Composition_js_1.components)().labels;
    const service = {
        group: 'exposition',
        name: 'gateway',
        port: index_js_2.PORT,
        version: require('../package.json').version,
        variables: [],
        components: labels,
        resources: annotation.resources,
        ingress: { path: '/', hosts: [] },
        probe: {
            path: '/.ready',
            port: index_js_2.PORT,
            delay: index_js_2.DELAY
        }
    };
    if (annotation?.['/'] !== undefined) {
        const tree = (0, index_js_1.parse)(annotation['/'], Directive_js_1.shortcuts);
        service.variables.push({
            name: 'TOA_EXPOSITION',
            value: JSON.stringify(tree)
        });
    }
    const { debug, authorities } = annotation;
    service.ingress.hosts = Object.values(authorities);
    // leaving these undefined lets the context's own ingress section supply them
    if (annotation.class !== undefined)
        service.ingress.class = annotation.class;
    if (annotation.annotations !== undefined)
        service.ingress.annotations = annotation.annotations;
    const properties = { authorities };
    if (debug === true)
        properties.debug = true;
    service.variables.push({
        name: 'TOA_EXPOSITION_PROPERTIES',
        value: JSON.stringify(properties)
    });
    // Nested identity composition shares this process; gateway already exposes /.ready.
    service.variables.push({
        name: 'TOA_TELEMETRY_READY',
        value: JSON.stringify(false)
    });
    return { services: [service] };
}
//# sourceMappingURL=deployment.js.map