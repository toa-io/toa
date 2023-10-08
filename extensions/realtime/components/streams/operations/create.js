"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.effect = void 0;
const streams_1 = require("./lib/streams");
async function effect(key, context) {
    if (context.state[key] === undefined)
        (0, streams_1.addStream)(key, context.state);
    return context.state[key].fork();
}
exports.effect = effect;
//# sourceMappingURL=create.js.map