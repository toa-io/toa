"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const http = __importStar(require("./HTTP/index.js"));
const schemas = __importStar(require("./schemas.js"));
const Mapping_js_1 = require("./Mapping.js");
class Query {
    parameterized;
    query;
    closed = false;
    prepend = ';';
    queryable;
    searchable;
    constructor(query) {
        this.parameterized = query?.parameters !== undefined;
        this.queryable = (0, Mapping_js_1.queryable)(query);
        this.searchable = query?.search === true;
        if (this.queryable) {
            query.omit ??= { value: 0, range: [0, 1000] };
            query.limit ??= { value: 10, range: [1, 100] };
            if (query.criteria !== undefined) {
                // eslint-disable-next-line max-depth
                if (query.criteria.endsWith(';'))
                    query.criteria = query.criteria.slice(0, -1);
                else
                    this.closed = true;
                // eslint-disable-next-line max-depth
                if (query.criteria.startsWith(',') || query.criteria.startsWith(';')) {
                    this.prepend = query.criteria[0];
                    query.criteria = query.criteria.slice(1);
                }
            }
        }
        this.query = query;
    }
    fit(query, parameters) {
        const qs = this.split(query);
        if (qs.query !== null) {
            const error = schemas.querystring.fit(qs.query);
            if (error !== null)
                throw new http.BadRequest('Query ' + error.message);
            this.fitCriteria(qs.query, parameters);
            this.fitRanges(qs.query);
            this.fitSort(qs.query);
            if (this.query.deleted !== undefined)
                qs.query.deleted = this.query.deleted;
        }
        return {
            query: qs.query,
            parameters: qs.parameters
        };
    }
    explain(introspection) {
        if (this.query?.parameters === undefined || introspection.input?.type !== 'object')
            return null;
        let query = null;
        for (const parameter of this.query.parameters) {
            const schema = introspection.input.properties[parameter];
            if (schema !== undefined) {
                query ??= {};
                query[parameter] = schema;
            }
            delete introspection.input.properties[parameter];
        }
        return query;
    }
    split(query) {
        let parameters = null;
        if (this.query?.parameters !== undefined)
            for (const key in query)
                // eslint-disable-next-line max-depth
                if (this.query.parameters.includes(key)) {
                    parameters ??= {};
                    parameters[key] = query[key];
                    delete query[key];
                }
        if (!this.queryable) {
            const keys = Object.keys(query);
            if (keys.length > 0)
                throw new http.BadRequest(`Query parameter '${keys[0]}' is not allowed`);
            query = null;
        }
        if (query?.search !== undefined && !this.searchable)
            throw new http.BadRequest('Query search is not allowed');
        return {
            query,
            parameters
        };
    }
    fitCriteria(query, parameters) {
        const groups = [];
        const idx = parameters.findIndex((parameter) => parameter.name === 'id');
        if (idx !== -1) {
            query.id = parameters[idx].value;
            parameters.splice(idx, 1);
        }
        if (parameters.length > 0) {
            const criteria = parameters
                .map(({ name, value }) => `${name}==${value}`)
                .join(';');
            groups.push({ criteria, operator: this.prepend });
        }
        if (this.query.criteria !== undefined)
            groups.push({ criteria: this.query.criteria, operator: ';' });
        if (query.criteria !== undefined)
            if (this.closed)
                throw new http.BadRequest('Query criteria is closed');
            else
                groups.push({ criteria: query.criteria, operator: WHATEVER });
        if (groups.length > 0)
            query.criteria = groups.reduce((acc, { criteria, operator }, i) => {
                return i === groups.length - 1
                    ? `${acc}(${criteria})`
                    : `${acc}(${criteria})${operator}`;
            }, '');
    }
    fitRanges(qs) {
        const query = qs;
        node_assert_1.default.ok(this.query.limit !== undefined, 'Query limit must be defined');
        node_assert_1.default.ok(this.query.omit !== undefined, 'Query limit range must be defined');
        if (qs.limit !== undefined)
            query.limit = fit(qs.limit, this.query.limit.range, 'limit');
        else
            query.limit = this.query.limit.value;
        if (qs.omit !== undefined)
            query.omit = fit(qs.omit, this.query.omit.range, 'omit');
    }
    fitSort(qs) {
        const query = qs;
        if (qs.sort === undefined && this.query.sort === undefined)
            return;
        const sort = (this.query.sort ?? '') + (qs.sort ?? '');
        query.sort = sort.split(';');
    }
}
exports.Query = Query;
function fit(string, range, name) {
    const number = parseInt(string);
    if (number < range[0] || number > range[1])
        throw new http.BadRequest(`Query ${name} must be between ` +
            `${range[0]} and ${range[1]} inclusive`);
    return number;
}
const WHATEVER = ';';
//# sourceMappingURL=Query.js.map