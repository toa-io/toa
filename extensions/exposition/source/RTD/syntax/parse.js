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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
exports.createNode = createNode;
const schemas = __importStar(require("../../schemas.js"));
const types_js_1 = require("./types.js");
function parse(input, shortcuts) {
    const node = parseNode(input, shortcuts);
    schemas.node.validate(node);
    return node;
}
function parseNode(input, shortcuts) {
    const node = createNode();
    if (typeof input === 'string') {
        node.forward = input;
        return node;
    }
    for (const [key, value] of Object.entries(input))
        switch (key) {
            case 'protected':
            case 'isolated':
                node[key] = value;
                break;
            case 'forward':
                node[key] = value;
                break;
            default:
                // eslint-disable-next-line max-depth
                if (key[0] === '/') {
                    const route = parseRoute(key, value, shortcuts);
                    node.routes.push(route);
                    continue;
                }
                // eslint-disable-next-line max-depth
                if (types_js_1.verbs.has(key)) {
                    const method = parseMethod(key, value, shortcuts);
                    node.methods.push(method);
                    continue;
                }
                // eslint-disable-next-line no-case-declarations
                const directive = parseDirective(key, value, shortcuts);
                // eslint-disable-next-line max-depth
                if (directive !== null) {
                    node.directives.push(directive);
                    continue;
                }
                throw new Error(`RTD parse error: unknown key '${key}'`);
        }
    return node;
}
function createNode() {
    return {
        routes: [],
        methods: [],
        directives: []
    };
}
function parseRoute(path, value, shortcuts) {
    const node = parse(value, shortcuts);
    return createRoute(path, node);
}
function createRoute(path, node) {
    return { path, node };
}
function parseMethod(verb, value, shortcuts) {
    const mapping = typeof value === 'string' ? { endpoint: value } : value;
    parseEndpoint(mapping);
    parseQuery(mapping);
    const directives = parseDirectives(mapping, shortcuts);
    return { verb, mapping, directives };
}
function parseEndpoint(mapping) {
    if (mapping.endpoint === undefined)
        return;
    const [endpoiont, component, namespace] = mapping.endpoint.split('.').reverse();
    if (component !== undefined) {
        mapping.component = component;
        mapping.namespace = namespace ?? mapping.namespace ?? 'default';
        mapping.endpoint = endpoiont;
    }
}
function parseQuery(mapping) {
    const query = mapping.query;
    if (query === undefined || query === null)
        return;
    if (typeof query.limit === 'number')
        query.limit = expandRange(query.limit);
    if (typeof query.omit === 'number')
        query.omit = expandRange(query.omit);
}
function parseDirectives(mapping, shortcuts) {
    const directives = [];
    for (const [key, value] of Object.entries(mapping)) {
        const directive = parseDirective(key, value, shortcuts);
        if (directive === null)
            continue;
        directives.push(directive);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete mapping[key];
    }
    return directives;
}
function parseDirective(key, value, shortcuts) {
    if (shortcuts?.has(key) === true)
        key = shortcuts.get(key); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    const match = key.match(DIRECTIVE_RX);
    if (match === null)
        return null;
    const { family, name } = match.groups;
    return { family, name, value };
}
function expandRange(range) {
    return { value: range, range: [range, range] };
}
const DIRECTIVE_RX = /^(?<family>\w{1,32}):(?<name>\w{1,32})$/;
//# sourceMappingURL=parse.js.map