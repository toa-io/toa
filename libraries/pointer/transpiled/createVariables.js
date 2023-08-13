"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVariables = void 0;
const Deployment_1 = require("./Deployment");
const annotation_1 = require("./annotation");
function createVariables(id, declaration, requests) {
    const annotation = (0, annotation_1.normalize)(declaration);
    const deployment = new Deployment_1.Deployment(id, annotation);
    return deployment.export(requests);
}
exports.createVariables = createVariables;
//# sourceMappingURL=createVariables.js.map