"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.email = email;
const generic_1 = require("@toa.io/generic");
function email(_, domain = '@agent.test') {
    return (0, generic_1.newid)() + domain;
}
//# sourceMappingURL=email.js.map