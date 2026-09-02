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
exports.Throttle = void 0;
const index_js_1 = require("../../HTTP/index.js");
const schemas = __importStar(require("./schemas.js"));
const index_js_2 = require("./lib/throttle/index.js");
class Throttle {
    quotas;
    constructor(declaration, sync, route) {
        this.quotas = index_js_2.Quotas.create((0, index_js_2.parse)(declaration), route);
        sync.register(this.quotas);
    }
    static validate(declaration) {
        schemas.throttle.validate(declaration, 'Incorrect \'io:throttle\' format');
    }
    preflight(context, parameters) {
        const retry = this.quotas.check(context, parameters);
        if (retry > 0)
            throw new index_js_1.TooManyRequests(retry);
    }
    settle(context, output) {
        this.quotas.use(context, output);
    }
}
exports.Throttle = Throttle;
//# sourceMappingURL=Throttle.js.map