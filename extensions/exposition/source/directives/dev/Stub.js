"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stub = void 0;
class Stub {
    value;
    constructor(value) {
        this.value = value;
    }
    apply() {
        return { body: this.value };
    }
}
exports.Stub = Stub;
//# sourceMappingURL=Stub.js.map