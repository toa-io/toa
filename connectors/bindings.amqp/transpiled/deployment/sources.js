"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveURIs = exports.createDependency = void 0;
const pointer_1 = require("@toa.io/pointer");
function createDependency(sources, instances) {
    const requests = [];
    for (const instance of instances) {
        const request = createRequest(instance);
        if (request !== null)
            requests.push(request);
    }
    const variables = (0, pointer_1.createVariables)(ID, sources, requests);
    return { variables };
}
exports.createDependency = createDependency;
async function resolveURIs(locator, label) {
    return await (0, pointer_1.resolve)(ID, locator.id);
}
exports.resolveURIs = resolveURIs;
function createRequest(instance) {
    const group = instance.locator.label;
    const selectors = createSelectors(instance.component);
    if (selectors === null)
        return null;
    else
        return { group, selectors };
}
function createSelectors(component) {
    if (component.receivers === undefined)
        return null;
    const sources = Object.values(component.receivers).map((receiver) => receiver.source);
    return sources.filter((source) => source !== undefined);
}
const ID = 'amqp-sources';
//# sourceMappingURL=sources.js.map