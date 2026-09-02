"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Id = void 0;
class Id {
    parameter;
    constructor(parameter) {
        this.parameter = parameter;
    }
    authorize(identity, _, parameters) {
        if (identity === null)
            return false;
        const parameter = parameters.find((parameter) => parameter.name === this.parameter);
        return parameter?.value === identity.id;
    }
}
exports.Id = Id;
//# sourceMappingURL=Id.js.map