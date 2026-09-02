"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Anyone = void 0;
class Anyone {
    allow;
    constructor(allow) {
        this.allow = allow;
    }
    authorize(_, context) {
        return context.identity !== null && this.allow;
    }
}
exports.Anyone = Anyone;
//# sourceMappingURL=Anyone.js.map