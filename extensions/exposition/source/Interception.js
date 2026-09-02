"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interception = void 0;
class Interception {
    interceptors;
    constructor(interceptors) {
        this.interceptors = interceptors;
        // interceptors are module singletons, so a second gateway in one process —
        // which is how the features run — would otherwise inherit the first one's state
        for (const interceptor of interceptors)
            interceptor.reset?.();
    }
    async intercept(input) {
        for (const interceptor of this.interceptors) {
            const output = await interceptor.intercept(input);
            if (output !== null)
                return output;
        }
        return null;
    }
}
exports.Interception = Interception;
//# sourceMappingURL=Interception.js.map