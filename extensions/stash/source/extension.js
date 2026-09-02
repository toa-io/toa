"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ID = exports.Factory = void 0;
exports.deployment = deployment;
const pointer_1 = require("@toa.io/pointer");
const Aspect_js_1 = require("./Aspect.js");
const Connection_js_1 = require("./Connection.js");
class Factory {
    aspect(locator) {
        const connection = new Connection_js_1.Connection(locator);
        return new Aspect_js_1.Aspect(connection);
    }
}
exports.Factory = Factory;
function deployment(instances, annotation) {
    const requests = instances.map((instance) => createRequest(instance));
    const variables = (0, pointer_1.createVariables)(exports.ID, annotation, requests);
    return { variables };
}
function createRequest(instance) {
    return {
        group: instance.locator.label,
        selectors: [instance.locator.id]
    };
}
exports.ID = 'stash';
//# sourceMappingURL=extension.js.map