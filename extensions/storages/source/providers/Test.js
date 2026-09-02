"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const Temporary_js_1 = require("./Temporary.js");
class Test extends Temporary_js_1.Temporary {
    static SECRETS = [
        { name: 'USERNAME' },
        { name: 'PASSWORD' }
    ];
    constructor(options) {
        super(options);
    }
}
exports.Test = Test;
//# sourceMappingURL=Test.js.map