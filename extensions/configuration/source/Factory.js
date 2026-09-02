"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Factory = void 0;
const Aspect_js_1 = require("./Aspect.js");
const Client_js_1 = require("./Client.js");
const Composition_js_1 = require("./Composition.js");
const configuration_js_1 = require("./configuration.js");
class Factory {
    boot;
    client = null;
    constructor(boot) {
        this.boot = boot;
    }
    aspect(locator, manifest) {
        const client = (0, configuration_js_1.overridden)(locator) ? null : this.shared();
        return new Aspect_js_1.Aspect(locator, manifest, client);
    }
    service() {
        return new Composition_js_1.Composition(this.boot);
    }
    shared() {
        if (this.client === null || this.client.disposed)
            this.client = new Client_js_1.Client(this.boot);
        return this.client;
    }
}
exports.Factory = Factory;
//# sourceMappingURL=Factory.js.map