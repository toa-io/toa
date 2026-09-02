"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Factory = void 0;
const core_1 = require("@toa.io/core");
const annotation_js_1 = require("./annotation.js");
const const_js_1 = require("./const.js");
const describe_js_1 = require("./describe.js");
const Reporter_js_1 = require("./Reporter.js");
const Tenant_js_1 = require("./Tenant.js");
const Composition_js_1 = require("./Composition.js");
const Explorer_js_1 = require("./Explorer.js");
const UI_js_1 = require("./UI.js");
const sample_js_1 = require("./sample.js");
class Factory {
    boot;
    options;
    settings = {};
    reporter = null;
    constructor(boot) {
        this.boot = boot;
        this.options = (0, annotation_js_1.environment)();
    }
    tenant(locator, decl, manifest) {
        const resolved = (0, annotation_js_1.settings)(locator.namespace, (0, annotation_js_1.component)(decl), this.options);
        this.settings[locator.id] = resolved;
        if (!resolved.enabled || locator.namespace === const_js_1.NAMESPACE)
            return new core_1.Connector();
        return new Tenant_js_1.Tenant(this.collector(), (0, describe_js_1.describe)(manifest));
    }
    component(component) {
        const locator = component.locator;
        const resolved = this.resolve(locator);
        if (!resolved.enabled)
            return component;
        const reporter = this.collector();
        const invoke = component.invoke.bind(component);
        component.invoke = async (endpoint, request) => {
            let outcome = 'ok';
            let reply;
            try {
                reply = await invoke(endpoint, request);
                if (reply?.exception !== undefined)
                    outcome = 'exception';
                else if (reply?.error !== undefined)
                    outcome = 'error';
                return reply;
            }
            catch (error) {
                outcome = 'exception';
                throw error;
            }
            finally {
                // a call that failed is still a connection between two components
                const src = request?.source ?? UNKNOWN;
                const dst = { namespace: locator.namespace, component: locator.name, operation: endpoint };
                const sample = resolved.samples && (0, sample_js_1.samplable)(request?.input)
                    ? (0, sample_js_1.capture)(request?.input, outcome)
                    : undefined;
                reporter.observe({ src, dst, sample });
            }
        };
        component.depends(reporter);
        return component;
    }
    service() {
        if (this.options === null)
            return null;
        const composition = new Composition_js_1.Composition(this.boot);
        const explorer = new Explorer_js_1.Explorer();
        explorer.depends(composition);
        if (this.options.ui)
            explorer.depends(new UI_js_1.UI(const_js_1.UI_PORT));
        return explorer;
    }
    /**
     * `tenant()` runs before any component is created, so settings are warm.
     * A component booted on its own (without a composition) falls back to
     * the environment, with sampling off.
     */
    resolve(locator) {
        if (locator.namespace === const_js_1.NAMESPACE)
            return annotation_js_1.DISABLED;
        return this.settings[locator.id] ??
            (0, annotation_js_1.settings)(locator.namespace, {}, this.options === null ? null : { ...this.options, samples: false });
    }
    collector() {
        this.reporter ??= new Reporter_js_1.Reporter(this.boot, this.options);
        return this.reporter;
    }
}
exports.Factory = Factory;
const UNKNOWN = { service: 'unknown' };
//# sourceMappingURL=Factory.js.map