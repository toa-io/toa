"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Algorithm = void 0;
const node_child_process_1 = require("node:child_process");
const node_os_1 = require("node:os");
const core_1 = require("@toa.io/core");
class Algorithm extends core_1.Connector {
    shell;
    path;
    constructor(path) {
        super();
        const shell = (0, node_os_1.userInfo)().shell;
        if (shell === null)
            throw new Error('The shell is not available. Am I running on Windows?');
        this.shell = shell;
        this.path = path;
    }
    async mount() {
    }
    async execute(input) {
        const args = (input === undefined || input === null)
            ? []
            : Object.entries(input).map(([key, value]) => ['--' + key, value?.toString() ?? '']).flat();
        const result = (0, node_child_process_1.spawnSync)(this.shell, [this.path].concat(args), { shell: true });
        if (result.status === 0) {
            const output = result.stdout.toString().trim();
            return { output };
        }
        else {
            const error = new Error(result.stderr.toString().trim());
            if (result.status === 1)
                return { output: error };
            else
                throw error;
        }
    }
}
exports.Algorithm = Algorithm;
//# sourceMappingURL=Algorithm.js.map