"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISABLED = void 0;
exports.options = options;
exports.environment = environment;
exports.component = component;
exports.settings = settings;
const const_js_1 = require("./const.js");
exports.DISABLED = { enabled: false, samples: false };
function options(annotation) {
    const declaration = annotation === undefined || annotation === false ? {} : annotation;
    return {
        samples: declaration.samples === true,
        interval: declaration.interval ?? const_js_1.DEFAULT_INTERVAL,
        threshold: declaration.threshold ?? const_js_1.DEFAULT_THRESHOLD,
        ui: declaration.ui !== false
    };
}
/** Reads what `deployment()` has put into the environment. */
function environment() {
    const value = process.env[const_js_1.ENV];
    if (value === undefined)
        return null;
    return JSON.parse(value);
}
function component(declaration) {
    if (declaration === false)
        return false;
    // predefined extensions arrive as null for components that say nothing
    if (declaration === null || declaration === undefined)
        return {};
    return declaration.samples === undefined ? {} : { samples: declaration.samples };
}
/**
 * Both levels must agree, and either can veto: the context is the environment
 * ceiling, the manifest is the component's own call. A component handling
 * personal data opts out for good, and no context flag overrides that.
 */
function settings(namespace, declaration, opts) {
    if (opts === null || declaration === false)
        return exports.DISABLED;
    const samples = opts.samples && declaration.samples !== false && !const_js_1.DENIED.has(namespace);
    return { enabled: true, samples };
}
//# sourceMappingURL=annotation.js.map