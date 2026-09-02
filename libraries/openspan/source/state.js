"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.state = void 0;
const node_async_hooks_1 = require("node:async_hooks");
const KEY = Symbol.for('openspan.state');
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
exports.state = globalThis[KEY] ??= {
    storage: new node_async_hooks_1.AsyncLocalStorage(),
    sample: 1,
    bucket: null,
    exporters: null
};
//# sourceMappingURL=state.js.map