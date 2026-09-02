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
exports.Input = void 0;
const index_js_1 = require("../../HTTP/index.js");
const schemas = __importStar(require("./schemas.js"));
class Input {
    allowed;
    constructor(permissions) {
        this.allowed = new Set(permissions);
    }
    static validate(permissions) {
        schemas.input.validate(permissions, 'Incorrect \'io:input\' format');
    }
    preflight(context) {
        // Restrictions are on what the client sent, so the check goes to the front of the
        // pipeline whatever order the families ran in: `auth:delegate` embeds the identity
        // and `map:*` assigns mapped properties, and those additions are the server's own,
        // not input to be restricted.
        context.pipelines.body.unshift((body) => this.check(body));
    }
    check(body) {
        if (body === undefined)
            return body;
        try {
            schemas.message.validate(body);
        }
        catch {
            throw new index_js_1.BadRequest('Invalid request body');
        }
        const property = this.violation(body);
        if (property !== undefined)
            throw new index_js_1.BadRequest(`Unexpected input: ${property}`);
        return body;
    }
    violation(value) {
        if (!Array.isArray(value))
            return Object.keys(value).find((key) => !this.allowed.has(key));
        for (const item of value) {
            const property = this.violation(item);
            if (property !== undefined)
                return property;
        }
    }
}
exports.Input = Input;
//# sourceMappingURL=Input.js.map