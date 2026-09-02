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
exports.Output = void 0;
const node_stream_1 = require("node:stream");
const openspan_1 = require("openspan");
const schemas = __importStar(require("./schemas.js"));
class Output {
    disabled = false;
    omitted = true;
    permissions = [];
    allowed;
    constructor(permissions) {
        if (typeof permissions === 'boolean')
            if (permissions)
                this.disabled = true;
            else
                this.omitted = false;
        else
            this.permissions = permissions;
        this.allowed = new Set(this.permissions);
    }
    static validate(permissions) {
        schemas.output.validate(permissions, 'Incorrect \'io:output\' format');
    }
    preflight(context) {
        context.pipelines.response.push(this.restriction(context));
    }
    restriction(context) {
        return (message) => {
            const error = message.status !== undefined && message.status >= 300;
            const stream = message.body instanceof node_stream_1.Stream;
            const none = message.body === undefined || message.body === null;
            if (this.disabled || error || stream || none)
                return;
            if (typeof message.body !== 'object' || this.permissions.length === 0) {
                if (this.omitted)
                    openspan_1.console.warn('Permissions for \'io:output\' are not specified properly, response omitted', { path: context.url.pathname });
                delete message.body;
                return;
            }
            schemas.message.validate(message.body, '\'io:output\' expects response to be an object or array of objects');
            if (Array.isArray(message.body))
                message.body = message.body.map((entity) => this.fit(entity));
            else
                message.body = this.fit(message.body);
        };
    }
    /** Runs per entity of a collection, hence the set and the absence of intermediates. */
    fit(message) {
        const output = {};
        // the keys of the entity, so that the response keeps the order it was built in
        for (const key of Object.keys(message))
            if (this.allowed.has(key))
                output[key] = message[key];
        return output;
    }
}
exports.Output = Output;
//# sourceMappingURL=Output.js.map