"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Factory = void 0;
const Aspect_js_1 = require("./Aspect.js");
class Factory {
    aspect(locator) {
        return new Aspect_js_1.Aspect(locator);
    }
}
exports.Factory = Factory;
//# sourceMappingURL=Factory.js.map