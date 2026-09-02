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
exports.manifest = manifest;
const node_assert_1 = __importDefault(require("node:assert"));
const index_js_1 = require("./RTD/syntax/index.js");
const Directive_js_1 = require("./Directive.js");
const schemas = __importStar(require("./schemas.js"));
function manifest(declaration, manifest) {
    node_assert_1.default.ok(typeof declaration === 'object' && declaration !== null, 'Exposition declaration must be an object');
    declaration = wrap(declaration, manifest.namespace, manifest.name);
    const node = (0, index_js_1.parse)(declaration, Directive_js_1.shortcuts);
    specify(node, manifest);
    schemas.node.validate(node);
    return node;
}
function wrap(declaration, namespace, name) {
    const path = (namespace === undefined || namespace === 'default' ? '' : '/' + namespace) +
        '/' + name;
    return { [path]: declaration };
}
function specify(node, manifest) {
    for (const route of node.routes) {
        for (const method of route.node.methods)
            specifyMethod(method, manifest);
        specify(route.node, manifest);
    }
}
function specifyMethod(method, manifest) {
    if (method.mapping?.endpoint === undefined)
        return;
    const operation = manifest.operations[method.mapping.endpoint];
    node_assert_1.default.ok(operation !== undefined, `Operation '${method.mapping.endpoint}' not found`);
    if (method.mapping.query === undefined)
        method.mapping.query = operation.query === false ? null : {};
    method.mapping.namespace = manifest.namespace;
    method.mapping.component = manifest.name;
}
//# sourceMappingURL=manifest.js.map