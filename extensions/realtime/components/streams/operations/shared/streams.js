"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stream = void 0;
const node_stream_1 = require("node:stream");
class Stream extends node_stream_1.Duplex {
    constructor() {
        super({ objectMode: true });
    }
    _read() {
    }
}
exports.Stream = Stream;
//# sourceMappingURL=streams.js.map