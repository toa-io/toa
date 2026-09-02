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
exports.standalone = void 0;
exports.deployment = deployment;
const annotation_js_1 = require("./annotation.js");
const Composition_js_1 = require("./Composition.js");
const const_js_1 = require("./const.js");
const schemas = __importStar(require("./schemas.js"));
exports.standalone = true;
/**
 * The explorer hosts the introspection components, exactly as the exposition
 * gateway hosts the identity ones. Collection is on unless the context says
 * `introspection: false`, and the environment variable is emitted together
 * with the service — never on its own, or tasks would pile up in a queue
 * nothing consumes.
 */
function deployment(_, annotation) {
    if (annotation === false)
        return {};
    if (annotation !== undefined)
        schemas.annotation.validate(annotation);
    const opts = (0, annotation_js_1.options)(annotation);
    const service = {
        group: 'introspection',
        name: 'explorer',
        version: require('../package.json').version,
        components: (0, Composition_js_1.components)().labels,
        resources: annotation?.resources,
        variables: []
    };
    if (opts.ui) {
        service.port = const_js_1.UI_PORT;
        service.ingress = { path: const_js_1.UI_PATH };
    }
    return {
        services: [service],
        variables: { global: [{ name: const_js_1.ENV, value: JSON.stringify(opts) }] }
    };
}
//# sourceMappingURL=extension.js.map