"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logs = void 0;
const core_1 = require("@toa.io/core");
const openspan_1 = require("openspan");
class Logs extends core_1.Connector {
    name = 'logs';
    locator;
    console;
    consoles = {};
    constructor(locator, options) {
        super();
        this.locator = locator;
        this.console = openspan_1.console.fork();
        this.console.configure(options);
    }
    // eslint-disable-next-line max-params
    invoke(operation, severity, message, attributes) {
        if (!(operation in this.consoles))
            this.consoles[operation] = this.console.fork({
                namespace: this.locator.namespace,
                component: this.locator.name,
                operation
            });
        if (severity === 'fork')
            return this.consoles[operation].fork(message);
        else
            this.consoles[operation][severity](message, attributes);
    }
}
exports.Logs = Logs;
//# sourceMappingURL=Logs.js.map