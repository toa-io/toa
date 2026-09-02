"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mapping = void 0;
exports.queryable = queryable;
const Query_js_1 = require("./Query.js");
class Mapping {
    query;
    constructor(query) {
        this.query = query;
    }
    static create(query) {
        const q = new Query_js_1.Query(query);
        return queryable(query)
            ? new QueryableMapping(q)
            : new InputMapping(q);
    }
    explain(introspection) {
        return this.query.explain(introspection);
    }
    assign(input, qs) {
        if (qs.parameters !== null) {
            if (typeof input !== 'object' || input === null)
                throw new Error('Input must be an object to embed query parameters');
            Object.assign(input, qs.parameters);
        }
    }
}
exports.Mapping = Mapping;
class QueryableMapping extends Mapping {
    queryable = true;
    fit(input, query, parameters) {
        const request = {};
        const qs = this.query.fit(query, parameters);
        if (input === undefined && qs.parameters !== null)
            input = {};
        this.assign(input, qs);
        if (input !== undefined)
            request.input = input;
        if (qs.query !== null)
            request.query = qs.query;
        return request;
    }
}
class InputMapping extends Mapping {
    queryable = false;
    fit(input, query, parameters) {
        const request = {};
        const qs = this.query.fit(query, parameters);
        if (input === undefined &&
            (this.query.parameterized || parameters.length > 0 || qs.parameters !== null))
            input = {};
        if (parameters.length > 0) {
            if (typeof input !== 'object' || input === null)
                throw new Error('Input must be an object to embed parameters');
            for (const parameter of parameters)
                input[parameter.name] = parameter.value;
        }
        this.assign(input, qs);
        if (input !== undefined)
            request.input = input;
        return request;
    }
}
function queryable(query) {
    if (query === undefined || query === null)
        return false;
    const keys = Object.keys(query);
    return !(keys.length === 1 && keys[0] === 'parameters');
}
//# sourceMappingURL=Mapping.js.map