"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = void 0;
const node_child_process_1 = require("node:child_process");
async function $(strings, ...args) {
    const command = parse(strings, args);
    return await new Promise((resolve, reject) => {
        (0, node_child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error !== null)
                reject(error);
            else
                resolve({ stdout, stderr });
        });
    });
}
exports.$ = $;
function parse(strings, args) {
    return strings.reduce((string, chunk, index) => {
        string += (index > 0 ? args[index - 1] : '') + chunk;
        return string;
    }, '');
}
//# sourceMappingURL=index.js.map