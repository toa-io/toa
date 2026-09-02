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
exports.Captures = exports.Agent = exports.negotiate = exports.parse = exports.request = void 0;
var request_js_1 = require("./request.js");
Object.defineProperty(exports, "request", { enumerable: true, get: function () { return request_js_1.request; } });
exports.parse = __importStar(require("./parse/index.js"));
var negotiate_js_1 = require("./negotiate.js");
Object.defineProperty(exports, "negotiate", { enumerable: true, get: function () { return negotiate_js_1.negotiate; } });
var Agent_js_1 = require("./Agent.js");
Object.defineProperty(exports, "Agent", { enumerable: true, get: function () { return Agent_js_1.Agent; } });
var Captures_js_1 = require("./Captures.js");
Object.defineProperty(exports, "Captures", { enumerable: true, get: function () { return Captures_js_1.Captures; } });
//# sourceMappingURL=index.js.map