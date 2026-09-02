"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Anonymous = void 0;
class Anonymous {
    allow;
    constructor(allow) {
        this.allow = allow;
    }
    authorize(_, context) {
        return 'authorization' in context.request.headers
            ? false
            : this.allow;
    }
}
exports.Anonymous = Anonymous;
//# sourceMappingURL=Anonymous.js.map