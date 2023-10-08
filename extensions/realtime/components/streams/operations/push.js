"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.effect = void 0;
async function effect({ key, event, data }, context) {
    if (context.state[key] !== undefined)
        context.state[key].push({ event, data });
}
exports.effect = effect;
//# sourceMappingURL=push.js.map