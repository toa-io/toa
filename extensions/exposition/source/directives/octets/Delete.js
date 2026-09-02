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
exports.Delete = void 0;
const stream_1 = require("stream");
const index_js_1 = require("../../HTTP/index.js");
const schemas = __importStar(require("./schemas.js"));
const index_js_2 = require("./workflows/index.js");
const Directive_js_1 = require("./Directive.js");
class Delete extends Directive_js_1.Directive {
    targeted = true;
    workflow;
    discovery;
    storage;
    constructor(options, discovery, remotes) {
        super();
        schemas.remove.validate(options);
        if (options?.workflow !== undefined)
            this.workflow = new index_js_2.Workflow(options.workflow, remotes);
        this.discovery = discovery;
    }
    async apply(storage, input, parameters) {
        this.storage ??= await this.discovery;
        const output = {};
        if (this.workflow !== undefined) {
            const entry = await this.storage.invoke('head', {
                input: {
                    storage,
                    path: input.request.url
                }
            });
            if (entry instanceof Error)
                throw new index_js_1.NotFound();
            output.status = 202;
            output.body = stream_1.Readable.from(this.execute(input, storage, entry, parameters));
        }
        else
            await this.delete(storage, input);
        return output;
    }
    async delete(storage, input) {
        await this.storage.invoke('delete', {
            input: {
                storage,
                path: input.request.url
            }
        });
    }
    // eslint-disable-next-line max-params
    async *execute(input, storage, entry, parameters) {
        const location = {
            storage,
            authority: input.authority,
            path: input.request.url
        };
        for await (const chunk of this.workflow.execute(location, entry, parameters)) {
            yield chunk;
            if (typeof chunk === 'object' && chunk !== null && 'error' in chunk)
                return;
        }
        await this.delete(storage, input);
    }
}
exports.Delete = Delete;
//# sourceMappingURL=Delete.js.map