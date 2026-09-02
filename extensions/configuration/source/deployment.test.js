"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const core_1 = require("@toa.io/core");
const deployment_js_1 = require("./deployment.js");
const epoch_js_1 = require("./epoch.js");
const const_js_1 = require("./const.js");
const schema = {
    type: 'object',
    properties: { foo: { type: 'string' }, key: { type: 'string' } }
};
function instance(name, defaults) {
    return {
        locator: new core_1.Locator(name, 'configuration'),
        manifest: { schema, defaults },
        component: {}
    };
}
(0, node_test_1.it)('should validate annotation', async () => {
    const wrongType = 'not ok';
    strict_1.default.throws(() => (0, deployment_js_1.deployment)([], wrongType), (error) => /object/.test(error.message));
});
(0, node_test_1.it)('should reject unknown components', async () => {
    strict_1.default.throws(() => (0, deployment_js_1.deployment)([instance('base')], { 'configuration.nope': {} }), (error) => /Component 'configuration\.nope' does not request configuration/.test(error.message));
});
(0, node_test_1.it)('should deploy the values service with the map', async () => {
    const instances = [instance('base', { foo: 'hello' }), instance('other')];
    const annotation = { 'configuration.other': { foo: 'set' } };
    const dependency = (0, deployment_js_1.deployment)(instances, annotation);
    strict_1.default.deepStrictEqual(dependency.events, [const_js_1.EVENT]);
    strict_1.default.strictEqual(dependency.services.length, 1);
    const service = dependency.services[0];
    strict_1.default.deepStrictEqual(service.group, 'configuration');
    strict_1.default.deepStrictEqual(service.name, 'values');
    strict_1.default.deepStrictEqual(service.components, ['configuration-values']);
    const variable = service.variables.find((variable) => variable.name === const_js_1.VALUES);
    strict_1.default.notStrictEqual(variable, undefined);
    strict_1.default.deepStrictEqual(JSON.parse(variable.value), (0, deployment_js_1.describe)(instances, annotation));
});
(0, node_test_1.it)('should describe every component', async () => {
    const instances = [instance('base', { foo: 'hello' }), instance('other')];
    const values = (0, deployment_js_1.describe)(instances, { 'configuration.other': { foo: 'set' } });
    strict_1.default.deepStrictEqual(values, {
        'configuration.base': { epoch: (0, epoch_js_1.epoch)(schema), schema, defaults: { foo: 'hello' } },
        'configuration.other': { epoch: (0, epoch_js_1.epoch)(schema), schema, defaults: { foo: 'set' } }
    });
});
(0, node_test_1.it)('should prefer the context over the manifest defaults', async () => {
    const values = (0, deployment_js_1.describe)([instance('base', { foo: 'hello' })], { 'configuration.base': { foo: 'bye' } });
    strict_1.default.deepStrictEqual(values['configuration.base'].defaults, { foo: 'bye' });
});
(0, node_test_1.it)('should not map values to the component', async () => {
    const dependency = (0, deployment_js_1.deployment)([instance('base')], { 'configuration.base': { foo: 'set' } });
    strict_1.default.deepStrictEqual(dependency.variables, {});
});
(0, node_test_1.it)('should map secrets to the component', async () => {
    const dependency = (0, deployment_js_1.deployment)([instance('base')], { 'configuration.base': { key: '$KEY' } });
    strict_1.default.deepStrictEqual(dependency.variables, {
        'configuration-base': [{
                name: 'TOA_CONFIGURATION__KEY',
                secret: { name: 'toa-configuration', key: 'KEY' }
            }]
    });
    // the service holds the reference, not the secret
    strict_1.default.deepStrictEqual((0, deployment_js_1.describe)([instance('base')], { 'configuration.base': { key: '$KEY' } })['configuration.base'].defaults, { key: '$KEY' });
});
//# sourceMappingURL=deployment.test.js.map