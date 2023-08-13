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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployment = void 0;
const generic_1 = require("@toa.io/generic");
const annotation_1 = require("./deployment/annotation");
const sources = __importStar(require("./deployment/sources"));
const context = __importStar(require("./deployment/context"));
function deployment(instances, declaration) {
    const annotation = (0, annotation_1.normalize)(declaration);
    const contextDependency = context.createDependency(annotation.context);
    const sourcesDependency = sources.createDependency(annotation.sources, instances);
    return (0, generic_1.merge)(contextDependency, sourcesDependency);
}
exports.deployment = deployment;
//# sourceMappingURL=deployment.js.map