"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = get;
function get(_, key) {
    const value = this.get(key);
    if (value === undefined)
        throw new Error(`Variable '${key}' is not set`);
    return value;
}
//# sourceMappingURL=get.js.map