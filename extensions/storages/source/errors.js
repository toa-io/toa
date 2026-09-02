"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERR_NOT_FOUND = void 0;
exports.ERR_NOT_FOUND = new (class NotFoundError extends Error {
    code = 'NOT_FOUND';
})();
//# sourceMappingURL=errors.js.map