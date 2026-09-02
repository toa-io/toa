"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Headers = void 0;
const index_js_1 = require("../../HTTP/index.js");
class Headers {
    headers;
    constructor(headers) {
        if (!Array.isArray(headers))
            headers = [headers];
        this.headers = headers;
    }
    preflight(context) {
        for (const header of this.headers)
            if (context.request.headers[header] === undefined)
                throw new index_js_1.BadRequest(`Header required: ${header}`);
    }
}
exports.Headers = Headers;
//# sourceMappingURL=Headers.js.map