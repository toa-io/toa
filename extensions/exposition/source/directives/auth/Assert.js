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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Assert = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const generic_1 = require("@toa.io/generic");
const http = __importStar(require("../../HTTP/index.js"));
const Incept_js_1 = require("./Incept.js");
class Assert {
    disabled;
    constructor(enabled) {
        node_assert_1.default.ok(typeof enabled === 'boolean', '`auth:assert` directive value must be a boolean');
        this.disabled = !enabled;
    }
    async authorize(identity, context) {
        if (!this.disabled)
            await this.incept(context, identity);
        return false;
    }
    async incept(context, identity) {
        if (context.request.headers.authorization === undefined)
            throw new http.Unauthorized();
        if (identity === null) {
            context.identity = await Incept_js_1.Incept.incept(context, (0, generic_1.newid)());
            context.pipelines.response.push((response) => {
                response.status = 201;
            });
        }
    }
}
exports.Assert = Assert;
//# sourceMappingURL=Assert.js.map