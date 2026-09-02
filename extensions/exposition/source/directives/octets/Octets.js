"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Octets = void 0;
const index_js_1 = require("../../HTTP/index.js");
const Context_js_1 = require("./Context.js");
const Put_js_1 = require("./Put.js");
const Get_js_1 = require("./Get.js");
const Delete_js_1 = require("./Delete.js");
const Workflow_js_1 = require("./Workflow.js");
class Octets {
    name = 'octets';
    mandatory = false;
    discovery = null;
    create(name, value, remotes) {
        const Class = DIRECTIVES[name];
        if (Class === undefined)
            throw new Error(`Directive 'octets:${name}' is not implemented`);
        this.discovery ??= remotes.discover('exposition', 'octets');
        return new Class(value, this.discovery, remotes);
    }
    async preflight(directives, input, parameters) {
        let context = null;
        let action = null;
        for (const directive of directives)
            if (directive instanceof Context_js_1.Context)
                context ??= directive;
            else if (action === null)
                action = directive;
            else
                throw new Error('Octets action is ambiguous');
        if (action === null)
            return null;
        // noinspection PointlessBooleanExpressionJS
        if (context === null)
            throw new Error('Octets context is not defined');
        const targeted = input.request.url[input.request.url.length - 1] !== '/';
        if (targeted !== action.targeted)
            throw new index_js_1.NotFound(`Trailing slash is ${action.targeted ? 'redundant' : 'required'}`);
        // noinspection JSObjectNullOrUndefined
        return await input.timing.capture(action.name, action.apply(context.storage, input, parameters));
    }
}
exports.Octets = Octets;
const DIRECTIVES = {
    context: Context_js_1.Context,
    put: Put_js_1.Put,
    get: Get_js_1.Get,
    head: Get_js_1.Get,
    delete: Delete_js_1.Delete,
    workflow: Workflow_js_1.WorkflowDirective
};
//# sourceMappingURL=Octets.js.map