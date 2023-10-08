"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stream = exports.addStream = void 0;
const node_stream_1 = require("node:stream");
function addStream(key, map) {
    const stream = new Stream();
    map[key] = stream;
    stream.once('close', () => delete map[key]);
}
exports.addStream = addStream;
class Stream extends node_stream_1.Duplex {
    forks = 0;
    constructor() {
        super(objectMode);
    }
    fork() {
        const destination = new node_stream_1.PassThrough(objectMode)
            .once('close', this.decrement.bind(this));
        this.increment();
        this.pipe(destination);
        return destination;
    }
    _read() {
    }
    increment() {
        this.forks++;
    }
    decrement() {
        this.forks--;
        if (this.forks === 0)
            this.destroy();
    }
}
exports.Stream = Stream;
const objectMode = { objectMode: true };
//# sourceMappingURL=streams.js.map