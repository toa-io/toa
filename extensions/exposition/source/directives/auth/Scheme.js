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
exports.Scheme = void 0;
const http = __importStar(require("../../HTTP/index.js"));
const split_js_1 = require("./split.js");
class Scheme {
    scheme;
    Scheme;
    constructor(scheme) {
        this.scheme = scheme.toLowerCase();
        this.Scheme = scheme[0].toUpperCase() + scheme.substring(1);
    }
    authorize(_, context) {
        if (context.request.headers.authorization === undefined)
            return false;
        const [scheme] = (0, split_js_1.split)(context.request.headers.authorization);
        if (scheme !== this.scheme)
            throw new http.Forbidden(this.Scheme +
                ' authentication scheme is required to access this resource');
        return false;
    }
}
exports.Scheme = Scheme;
//# sourceMappingURL=Scheme.js.map