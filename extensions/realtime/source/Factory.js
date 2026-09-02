"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Factory = void 0;
const core_1 = require("@toa.io/core");
const Realtime_js_1 = require("./Realtime.js");
const Composition_js_1 = require("./Composition.js");
const Routes_js_1 = require("./Routes.js");
class Factory {
    boot;
    constructor(boot) {
        this.boot = boot;
    }
    service() {
        const routes = new Routes_js_1.Routes(this.boot);
        const composition = new Composition_js_1.Composition(this.boot);
        const realtime = new Realtime_js_1.Realtime(routes, async () => await this.discovery());
        realtime.depends(routes);
        realtime.depends(composition);
        return realtime;
    }
    async discovery() {
        const locator = new core_1.Locator('streams', 'realtime');
        return await this.boot.remote(locator, { service: 'realtime' });
    }
}
exports.Factory = Factory;
//# sourceMappingURL=Factory.js.map