"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
class Role {
    static remote = null;
    roles;
    discovery;
    dynamic;
    constructor(roles, discovery) {
        this.roles = typeof roles === 'string' ? [roles] : roles;
        this.discovery = discovery;
        this.dynamic = this.roles.some((role) => role.includes('{'));
    }
    static async get(identity, discovery) {
        this.remote ??= await discovery;
        const query = {
            criteria: `identity==${identity.id}`,
            limit: 1024
        };
        return await this.remote.invoke('list', { query });
    }
    async authorize(identity, _, parameters) {
        if (identity === null)
            return false;
        identity.roles ??= await Role.get(identity, this.discovery);
        return this.match(identity.roles, parameters);
    }
    match(roles, parameters) {
        const required = this.dynamic ? this.substitute(parameters) : this.roles;
        for (const role of roles) {
            const ok = required.some((expected) => expected === role || expected.startsWith(role + ':'));
            if (ok)
                return true;
        }
        return false;
    }
    substitute(parameters) {
        return this.roles.map((role) => role.replaceAll(/{(\w+)}/g, (_, key) => {
            const value = parameters.find((parameter) => parameter.name === key)?.value;
            node_assert_1.default.ok(value !== undefined, `Role '${role}' requires '${key}' route parameter`);
            return value;
        }));
    }
}
exports.Role = Role;
//# sourceMappingURL=Role.js.map