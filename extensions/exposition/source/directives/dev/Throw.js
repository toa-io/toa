"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Throw = void 0;
class Throw {
    message;
    constructor(message) {
        this.message = message;
    }
    apply() {
        throw new Error(this.message);
    }
}
exports.Throw = Throw;
//# sourceMappingURL=Throw.js.map