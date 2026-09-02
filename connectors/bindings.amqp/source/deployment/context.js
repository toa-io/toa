"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDependency = createDependency;
exports.resolveURIs = resolveURIs;
const pointer_1 = require("@toa.io/pointer");
function createDependency(context) {
    const global = [];
    const variables = { global };
    const contextVariables = createVariables(context);
    global.push(...contextVariables);
    return { variables };
}
function resolveURIs(locator) {
    if (process.env.TOA_DEV === '1')
        return ['amqp://developer:secret@localhost'];
    const value = process.env[VARIABLE];
    if (value === undefined)
        throw new Error(`Environment variable ${VARIABLE} is not specified`);
    const map = JSON.parse(value);
    const record = (0, pointer_1.resolveRecord)(map, locator.id);
    return parseRecord(record);
}
function createVariables(context) {
    const variables = [];
    const uris = JSON.stringify(context);
    const contextVariable = {
        name: VARIABLE,
        value: uris
    };
    const secrets = createSecrets(context);
    variables.push(contextVariable, ...secrets);
    return variables;
}
function createSecrets(context) {
    const secrets = [];
    for (const key of Object.keys(context)) {
        const keySecrets = createKeySecrets(key);
        secrets.push(...keySecrets);
    }
    return secrets;
}
function createKeySecrets(key) {
    const username = createSecretVariable(key, 'username');
    const password = createSecretVariable(key, 'password');
    return [username, password];
}
function createSecretVariable(key, secretKey) {
    const varKey = key === '.' ? '' : key;
    const varName = pointer_1.naming.nameVariable(ID, varKey, secretKey.toUpperCase());
    const secName = pointer_1.naming.nameSecret(ID, key);
    return {
        name: varName,
        secret: {
            name: secName,
            key: secretKey
        }
    };
}
function parseRecord(record) {
    const urls = new Array(record.references.length);
    const key = record.key === '.' ? '' : record.key;
    const username = readEnv(key, 'USERNAME');
    const password = readEnv(key, 'PASSWORD');
    for (let i = 0; i < record.references.length; i++) {
        const url = new URL(record.references[i]);
        url.username = username;
        url.password = password;
        urls[i] = url.href;
    }
    return urls;
}
function readEnv(key, name) {
    const variable = pointer_1.naming.nameVariable(ID, key, name);
    const value = process.env[variable];
    if (value === undefined)
        throw new Error(variable + ' is not set');
    else
        return value;
}
const ID = 'amqp-context';
const VARIABLE = 'TOA_AMQP_CONTEXT';
//# sourceMappingURL=context.js.map