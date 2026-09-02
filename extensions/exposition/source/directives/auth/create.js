"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
const generic_1 = require("@toa.io/generic");
function create(credentials) {
    return {
        id: (0, generic_1.newid)(),
        scheme: credentials?.split(' ')[0] ?? null,
        refresh: false,
        roles: []
    };
}
//# sourceMappingURL=create.js.map