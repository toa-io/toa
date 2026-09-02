"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workflow = void 0;
const node_path_1 = require("node:path");
const matchacho_1 = require("matchacho");
const Execution_js_1 = require("./Execution.js");
class Workflow {
    units;
    remotes;
    constructor(units, remotes) {
        this.units = (0, matchacho_1.match)(units, Array, (units) => units, Object, (unit) => [unit]);
        this.remotes = remotes;
    }
    execute(location, entry, params) {
        const parameters = {};
        for (const { name, value } of params)
            parameters[name] = value;
        const context = {
            authority: location.authority,
            identity: location.identity,
            storage: location.storage,
            path: node_path_1.posix.join(location.path, entry.id),
            entry,
            parameters,
            steps: {}
        };
        return new Execution_js_1.Execution(context, this.units, this.remotes);
    }
}
exports.Workflow = Workflow;
//# sourceMappingURL=Workflow.js.map