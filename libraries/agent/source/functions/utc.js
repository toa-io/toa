"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utc = utc;
function utc(value) {
    const time = value === '' ? Date.now() : Number.parseInt(value);
    return new Date(time).toUTCString();
}
//# sourceMappingURL=utc.js.map