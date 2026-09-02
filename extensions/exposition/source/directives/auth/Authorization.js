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
exports.Authorization = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const matchacho_1 = require("matchacho");
const openspan_1 = require("openspan");
const minimatch_1 = require("minimatch");
const http = __importStar(require("../../HTTP/index.js"));
const Anonymous_js_1 = require("./Anonymous.js");
const Id_js_1 = require("./Id.js");
const Role_js_1 = require("./Role.js");
const Rule_js_1 = require("./Rule.js");
const Incept_js_1 = require("./Incept.js");
const Assert_js_1 = require("./Assert.js");
const Echo_js_1 = require("./Echo.js");
const Scheme_js_1 = require("./Scheme.js");
const Delegate_js_1 = require("./Delegate.js");
const Federation_js_1 = require("./Federation.js");
const Anyone_js_1 = require("./Anyone.js");
const Input_js_1 = require("./Input.js");
const split_js_1 = require("./split.js");
const schemes_js_1 = require("./schemes.js");
class Authorization {
    depends = ['Vary'];
    name = 'auth';
    mandatory = true;
    schemes = {};
    discovery = {};
    tokens = null;
    bans = null;
    create(name, value, remotes) {
        node_assert_1.default.ok(name in constructors, `Directive 'auth:${name}' is not implemented`);
        const Class = constructors[name];
        for (const name of REMOTES)
            this.discovery[name] ??= remotes.discover('identity', name);
        return (0, matchacho_1.match)(Class, Role_js_1.Role, () => new Role_js_1.Role(value, this.discovery.roles), Rule_js_1.Rule, () => new Rule_js_1.Rule(value, this.create.bind(this)), Input_js_1.Input, () => new Input_js_1.Input(value, this.create.bind(this)), Incept_js_1.Incept, () => new Incept_js_1.Incept(value, this.discovery), Delegate_js_1.Delegate, () => new Delegate_js_1.Delegate(value, this.discovery.roles), () => new Class(value));
    }
    arrange(directives) {
        directives.sort((a, b) => (a.priority ?? 1) - (b.priority ?? 1));
    }
    async preflight(directives, context, parameters) {
        context.identity = await this.resolve(context.authority, context.request.headers.authorization);
        for (const directive of directives) {
            const allow = await directive.authorize(context.identity, context, parameters);
            if (allow)
                if (this.permitted(context))
                    return directive.reply?.(context) ?? null;
                else
                    throw new http.Forbidden();
        }
        if (context.identity === null)
            throw new http.Unauthorized();
        else
            throw new http.Forbidden();
    }
    async settle(directives, context, response) {
        await Promise.all(directives.map(async (directive) => directive.settle?.(context, response)));
        const identity = context.identity;
        if (identity === null)
            return;
        if (identity.scheme === schemes_js_1.PRIMARY && !identity.refresh)
            return;
        if (await this.banned(identity))
            throw new http.Unauthorized();
        // Role directive may have already set the value
        identity.roles ??= await Role_js_1.Role.get(identity, this.discovery.roles);
        this.tokens ??= await this.discovery.tokens;
        const token = await this.tokens.invoke('encrypt', {
            input: { authority: context.authority, identity }
        });
        const authorization = `Token ${token}`;
        response.headers ??= new Headers();
        response.headers.set('authorization', authorization);
        response.headers.set('cache-control', 'no-store');
    }
    async resolve(authority, authorization) {
        if (authorization === undefined)
            return null;
        const [scheme, credentials] = (0, split_js_1.split)(authorization);
        const provider = schemes_js_1.PROVIDERS[scheme];
        if (provider === undefined)
            throw new http.Unauthorized(`Unknown authentication scheme '${scheme}'`);
        this.schemes[scheme] ??= await this.discovery[provider];
        const result = await this.schemes[scheme].invoke('authenticate', {
            input: {
                scheme,
                authority,
                credentials
            }
        });
        if (result instanceof Error) {
            const code = result.code;
            if (typeof code === 'string')
                openspan_1.console.info('Authentication failed', { code });
            return null;
        }
        const identity = result.identity;
        if (scheme !== schemes_js_1.PRIMARY && (await this.banned(identity)))
            throw new http.Unauthorized();
        identity.scheme = scheme;
        identity.refresh = result.refresh;
        return identity;
    }
    permitted(context) {
        const permissions = context.identity?.permissions;
        if (permissions === undefined)
            return true;
        return Object.entries(permissions).some(([pattern, methods]) => {
            return methods.some((method) => method === '*' || method === context.request.method) &&
                glob(pattern).match(context.request.url);
        });
    }
    async banned(identity) {
        this.bans ??= await this.discovery.bans;
        const ban = await this.bans.invoke('observe', { query: { id: identity.id } });
        return ban.banned;
    }
}
exports.Authorization = Authorization;
/**
 * `minimatch(str, pattern)` compiles the pattern on every call, and a permission is
 * matched on every request the identity makes. Patterns arrive with an identity, hence
 * the bound.
 */
function glob(pattern) {
    let compiled = GLOBS.get(pattern);
    if (compiled === undefined) {
        if (GLOBS.size >= GLOBS_LIMIT)
            GLOBS.clear();
        compiled = new minimatch_1.Minimatch(pattern);
        GLOBS.set(pattern, compiled);
    }
    return compiled;
}
const GLOBS = new Map();
const GLOBS_LIMIT = 1024;
const constructors = {
    anonymous: Anonymous_js_1.Anonymous,
    anyone: Anyone_js_1.Anyone,
    id: Id_js_1.Id,
    role: Role_js_1.Role,
    rule: Rule_js_1.Rule,
    incept: Incept_js_1.Incept,
    assert: Assert_js_1.Assert,
    scheme: Scheme_js_1.Scheme,
    echo: Echo_js_1.Echo,
    delegate: Delegate_js_1.Delegate,
    claims: Federation_js_1.Federation,
    input: Input_js_1.Input
};
const REMOTES = ['basic', 'federation', 'tokens', 'roles', 'bans', 'otp'];
//# sourceMappingURL=Authorization.js.map