"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipe = exports.addStream = void 0;
const node_stream_1 = require("node:stream");
function addStream(key, map) {
    const stream = new Stream();
    map[key] = stream;
}
exports.addStream = addStream;
function pipe(context, key) {
    const readable = new node_stream_1.PassThrough({ objectMode: true });
    context.state[key].pipe(readable);
    return readable;
}
exports.pipe = pipe;
class Stream extends node_stream_1.Duplex {
    constructor() {
        super({ objectMode: true });
    }
    _read() {
    }
}
//# sourceMappingURL=stream.js.map