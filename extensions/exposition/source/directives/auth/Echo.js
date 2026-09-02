"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Echo = void 0;
const create_js_1 = require("./create.js");
class Echo {
    authorize(identity, context) {
        if (identity === null && 'authorization' in context.request.headers)
            return false;
        context.identity ??= (0, create_js_1.create)();
        return true;
    }
    reply(context) {
        const body = context.identity;
        return body.scheme === null
            ? { status: 201, body }
            : { body };
    }
}
exports.Echo = Echo;
//# sourceMappingURL=Echo.js.map