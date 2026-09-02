"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unix = unix;
function unix(value) {
    return Math.floor(new Date(value).getTime() / 1000).toString();
}
//# sourceMappingURL=unix.js.map