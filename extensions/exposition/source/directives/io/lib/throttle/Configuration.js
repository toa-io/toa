"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
function parse(declaration) {
    const { key, condition, requests, interval } = declaration;
    return {
        key: mapKey(key),
        condition: mapCondition(condition),
        requests,
        interval: interval * 1000
    };
}
function mapKey(declaration) {
    const entries = Array.isArray(declaration) ? declaration : [declaration];
    // a bare `path`, or `segment: id` for the ones that take an argument
    return entries.flatMap((entry) => typeof entry === 'string'
        ? [{ method: entry }]
        : Object.entries(entry).map(([method, options]) => ({ method: method, options })));
}
function mapCondition(declaration) {
    if (declaration === undefined)
        return;
    // reduce to a single object, then map entries to rules
    const conditions = Array.isArray(declaration) ? declaration : [declaration];
    const single = conditions.reduce((acc, condition) => ({ ...acc, ...condition }), {});
    return Object.entries(single).map(([method, options]) => ({ method, options }));
}
//# sourceMappingURL=Configuration.js.map