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
exports.WorkflowDirective = void 0;
const index_js_1 = require("../../HTTP/index.js");
const schemas = __importStar(require("./schemas.js"));
const index_js_2 = require("./workflows/index.js");
const Directive_js_1 = require("./Directive.js");
class WorkflowDirective extends Directive_js_1.Directive {
    targeted = true;
    workflow;
    discovery;
    storage = null;
    constructor(units, discovery, remotes) {
        super();
        schemas.workflow.validate(units);
        this.workflow = new index_js_2.Workflow(units, remotes);
        this.discovery = discovery;
    }
    async apply(storage, input, parameters) {
        this.storage ??= await this.discovery;
        const entry = await this.storage.invoke('head', {
            input: {
                storage,
                path: input.request.url
            }
        });
        if (entry instanceof Error)
            throw new index_js_1.NotFound();
        const location = {
            storage,
            authority: input.authority,
            path: input.request.url
        };
        return {
            status: 202,
            body: this.workflow.execute(location, entry, parameters)
        };
    }
}
exports.WorkflowDirective = WorkflowDirective;
//# sourceMappingURL=Workflow.js.map