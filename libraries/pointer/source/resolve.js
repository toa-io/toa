"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = resolve;
exports.resolveRecord = resolveRecord;
const naming_js_1 = require("./naming.js");
function resolve(id, selector) {
    const variable = (0, naming_js_1.nameVariable)(id, selector);
    const value = process.env[variable];
    if (value === undefined)
        throw new Error(`${variable} is not set.`);
    const urls = value.split(' ');
    return withCredentials(variable, urls);
}
function resolveRecord(uris, selector) {
    if (selector in uris)
        return getRecord(uris, selector);
    const segments = selector.split('.');
    while (segments.pop() !== undefined) {
        const current = segments.join('.');
        if (current in uris)
            return getRecord(uris, current);
    }
    if ('.' in uris)
        return getRecord(uris, '.');
    else
        throw new Error(`Selector '${selector}' cannot be resolved.`);
}
function withCredentials(variable, urls) {
    const username = process.env[variable + '_USERNAME'] ?? '';
    const password = process.env[variable + '_PASSWORD'] ?? '';
    return urls.map((url) => addCredentials(url, username, password));
}
function addCredentials(ref, username, password) {
    const url = new URL(ref);
    url.username = username;
    url.password = password;
    return url.href;
}
function getRecord(uris, key) {
    return {
        key,
        references: uris[key]
    };
}
//# sourceMappingURL=resolve.js.map