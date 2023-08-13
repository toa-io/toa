"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsert = exports.get = void 0;
const command_1 = require("@toa.io/command");
async function get(name, namespace) {
    try {
        const { stdout } = await (0, command_1.$) `kubectl get secret ${name}${n(namespace)} -o json`;
        const secret = JSON.parse(stdout);
        return decode(secret.data);
    }
    catch {
        return null;
    }
}
exports.get = get;
async function upsert(name, data, namespace) {
    const value = await get(name, namespace) ?? {};
    Object.assign(value, data);
    await deploy(name, value, namespace);
}
exports.upsert = upsert;
async function deploy(name, data, namespace) {
    const secret = encode(name, data);
    const json = JSON.stringify(secret);
    await (0, command_1.$) `echo '${json}' | kubectl apply${n(namespace)} -f -`;
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