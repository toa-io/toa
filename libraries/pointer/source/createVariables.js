"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVariables = createVariables;
const Deployment_js_1 = require("./Deployment.js");
const annotation_js_1 = require("./annotation.js");
function createVariables(id, declaration, requests) {
    const annotation = (0, annotation_js_1.normalize)(declaration);
    const deployment = new Deployment_js_1.Deployment(id, annotation);
    return deployment.export(requests);
}
//# sourceMappingURL=createVariables.js.map