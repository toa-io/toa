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
exports.Incept = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const openspan_1 = require("openspan");
const http = __importStar(require("../../HTTP/index.js"));
const split_js_1 = require("./split.js");
const create_js_1 = require("./create.js");
const schemes_js_1 = require("./schemes.js");
const Role_js_1 = require("./Role.js");
class Incept {
    static schemes = {};
    static discovery;
    static bans = null;
    property;
    constructor(property, discovery) {
        node_assert_1.default.ok(property === null || typeof property === 'string', '`auth:incept` value must be a string or null');
        this.property = property;
        Incept.discovery ??= discovery;
    }
    static async incept(context, id) {
        const [scheme, credentials] = (0, split_js_1.split)(context.request.headers.authorization);
        const provider = schemes_js_1.PROVIDERS[scheme];
        if (provider === undefined)
            throw new http.BadRequest('Authentication scheme is not supported');
        if (!schemes_js_1.INCEPTION.includes(provider))
            throw new http.Unauthorized();
        Incept.bans ??= await Incept.discovery.bans;
        const ban = await Incept.bans.invoke('observe', { query: { id } });
        if (ban.banned)
            throw new http.Unauthorized();
        Incept.schemes[scheme] ??= await Incept.discovery[provider];
        const identity = await Incept.schemes[scheme].invoke('incept', {
            input: {
                scheme,
                authority: context.authority,
                id,
                credentials
            }
        });
        if (identity instanceof Error)
            throw new http.UnprocessableEntity(identity);
        identity.scheme = scheme;
        identity.roles = [];
        return identity;
    }
    authorize(identity) {
        return identity === null;
    }
    reply(context) {
        if (this.property !== null)
            return null;
        const body = (0, create_js_1.create)(context.request.headers.authorization);
        return { body };
    }
    async settle(context, response) {
        const id = response.body?.[this.property ?? 'id'];
        if (id === undefined) {
            openspan_1.console.debug('Inception skipped: response does not contain expected property', {
                property: this.property,
                response
            });
            return;
        }
        (0, node_assert_1.default)(typeof id === 'string', `Response body property "${this.property}" expected to be a string`);
        if (context.request.headers.authorization !== undefined)
            context.identity = await Incept.incept(context, id);
        else {
            const identity = { id, scheme: null, refresh: true };
            const roles = await Role_js_1.Role.get(identity, Incept.discovery.roles);
            context.identity = { ...identity, roles };
        }
    }
}
exports.Incept = Incept;
//# sourceMappingURL=Incept.js.map