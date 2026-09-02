"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = get;
exports.upsert = upsert;
const node_util_1 = require("node:util");
const node_child_process_1 = require("node:child_process");
const exec = (0, node_util_1.promisify)(node_child_process_1.exec);
async function get(name, namespace) {
    try {
        const { stdout } = await exec(`kubectl get secret ${name}${n(namespace)} -o json`);
        const secret = JSON.parse(stdout);
        return decode(secret.data);
    }
    catch {
        return null;
    }
}
async function upsert(name, data, namespace) {
    const value = await get(name, namespace) ?? {};
    Object.assign(value, data);
    await deploy(name, value, namespace);
}
async function deploy(name, data, namespace) {
    const secret = encode(name, data);
    const json = JSON.stringify(secret);
    await exec(`echo '${json}' | kubectl apply${n(namespace)} -f -`);
}
function decode(data) {
    return apply(data, atob);
}
function encode(name, data) {
    const encoded = apply(data, btoa);
    return {
        apiVersion: 'v1',
        kind: 'Secret',
        type: 'Opaque',
        metadata: { name },
        data: encoded
    };
}
function apply(data, fn) {
    const result = {};
    for (const [key, value] of Object.entries(data))
        result[key] = fn(value);
    return result;
}
function n(namespace) {
    return namespace === undefined ? '' : ` -n ${namespace}`;
}
//# sourceMappingURL=secrets.js.map