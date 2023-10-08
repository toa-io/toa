"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.effect = void 0;
const node_stream_1 = require("node:stream");
const streams_1 = require("./lib/streams");
async function effect(key, context) {
    if (context.state[key] === undefined)
        context.state[key] = new streams_1.Stream();
    return new node_stream_1.PassThrough()
        .pipe(context.state[key]);
}
exports.effect = effect;
//# sourceMappingURL=create.js.map