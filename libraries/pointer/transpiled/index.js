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
exports.naming = exports.normalize = exports.resolveRecord = exports.resolve = exports.createVariables = void 0;
var createVariables_1 = require("./createVariables");
Object.defineProperty(exports, "createVariables", { enumerable: true, get: function () { return createVariables_1.createVariables; } });
var resolve_1 = require("./resolve");
Object.defineProperty(exports, "resolve", { enumerable: true, get: function () { return resolve_1.resolve; } });
Object.defineProperty(exports, "resolveRecord", { enumerable: true, get: function () { return resolve_1.resolveRecord; } });
var annotation_1 = require("./annotation");
Object.defineProperty(exports, "normalize", { enumerable: true, get: function () { return annotation_1.normalize; } });
exports.naming = __importStar(require("./naming"));
//# sourceMappingURL=index.js.map