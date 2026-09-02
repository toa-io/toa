"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Explorer = void 0;
const core_1 = require("@toa.io/core");
const openspan_1 = require("openspan");
/**
 * The explorer process. It hosts the introspection components — the map is read
 * through their own operations — and serves the UI.
 */
class Explorer extends core_1.Connector {
    async open() {
        openspan_1.console.info('Introspection explorer started');
    }
    dispose() {
        openspan_1.console.info('Introspection explorer is closed');
    }
}
exports.Explorer = Explorer;
//# sourceMappingURL=Explorer.js.map