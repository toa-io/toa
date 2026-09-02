"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.id = id;
const generic_1 = require("@toa.io/generic");
function id(_, length) {
    return (0, generic_1.newid)().slice(0, length === undefined ? 32 : Number.parseInt(length));
}
//# sourceMappingURL=id.js.map