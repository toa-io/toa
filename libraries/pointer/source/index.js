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
Object.defineProperty(exports, "__esModule", { value: true });
exports.naming = exports.normalize = exports.resolveRecord = exports.resolve = exports.createVariables = void 0;
var createVariables_js_1 = require("./createVariables.js");
Object.defineProperty(exports, "createVariables", { enumerable: true, get: function () { return createVariables_js_1.createVariables; } });
var resolve_js_1 = require("./resolve.js");
Object.defineProperty(exports, "resolve", { enumerable: true, get: function () { return resolve_js_1.resolve; } });
Object.defineProperty(exports, "resolveRecord", { enumerable: true, get: function () { return resolve_js_1.resolveRecord; } });
var annotation_js_1 = require("./annotation.js");
Object.defineProperty(exports, "normalize", { enumerable: true, get: function () { return annotation_js_1.normalize; } });
exports.naming = __importStar(require("./naming.js"));
//# sourceMappingURL=index.js.map