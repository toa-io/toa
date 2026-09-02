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
exports.describe = describe;
const node_assert_1 = __importDefault(require("node:assert"));
const Composition_js_1 = require("./Composition.js");
const const_js_1 = require("./const.js");
const epoch_js_1 = require("./epoch.js");
const validators = __importStar(require("./schemas.js"));
function deployment(instances, annotation = {}) {
    const { resources, values } = split(annotation);
    annotation = prepare(values, instances);
    const variables = {};
    for (const instance of instances) {
        const values = annotation[instance.locator.id];
        if (values === undefined)
            continue;
        const secrets = createSecrets(values);
        if (secrets.length > 0)
            variables[instance.locator.label] = secrets;
    }
    const service = {
        group: 'configuration',
        name: 'values',
        version: require('../package.json').version,
        components: (0, Composition_js_1.components)().labels,
        resources,
        // the service that holds the values also serves the page that reads them
        port: const_js_1.UI_PORT,
        ingress: { path: const_js_1.UI_PATH },
        variables: [{
                name: const_js_1.VALUES,
                value: JSON.stringify(describe(instances, annotation))
            }]
    };
    return { services: [service], variables, events: [const_js_1.EVENT] };
}
/** What the values service is given: the epoch, the schema and the defaults of every component. */
function describe(instances, annotation = {}) {
    annotation = prepare(split(annotation).values, instances);
    const values = {};
    for (const { locator, manifest } of instances)
        values[locator.id] = {
            epoch: (0, epoch_js_1.epoch)(manifest.schema),
            schema: manifest.schema,
            defaults: annotation[locator.id] ?? manifest.defaults
        };
    return values;
}
function createSecrets(values) {
    const secrets = [];
    for (const value of Object.values(values)) {
        if (typeof value === 'object' && value !== null)
            secrets.push(...createSecrets(value));
        if (typeof value !== 'string')
            continue;
        const match = value.match(const_js_1.SECRET_RX);
        if (match === null)
            continue;
        const name = match.groups?.variable;
        node_assert_1.default.ok(name !== undefined);
        secrets.push({
            name: const_js_1.PREFIX + '_' + name,
            secret: {
                name: 'toa-configuration',
                key: name
            }
        });
    }
    return secrets;
}
/**
 * The service's own resources, and the component values that are the rest of the annotation.
 *
 * Every key here names a component, so the one option the service has of its own needs a
 * name that cannot be mistaken for one. `resources` is reserved: a component actually
 * called that is written with its namespace, `default.resources`, which is what an id is
 * anyway — the bare form is the shorthand.
 */
function split(annotation) {
    validators.annotation.validate(annotation);
    const { resources, ...values } = annotation;
    return { resources, values };
}
/** Validated, keyed by full component ids, and checked against the components that ask. */
function prepare(annotation, instances) {
    const normalized = {};
    const requested = instances.map((instance) => instance.locator.id);
    for (const [key, values] of Object.entries(annotation)) {
        const id = key.includes('.') ? key : 'default.' + key;
        node_assert_1.default.ok(requested.includes(id), `Component '${id}' does not request configuration or does not exist.`);
        normalized[id] = values;
    }
    return normalized;
}
//# sourceMappingURL=deployment.js.map