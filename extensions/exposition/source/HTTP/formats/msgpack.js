"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipart = exports.type = void 0;
exports.decode = decode;
exports.encode = encode;
const msgpackr_1 = require("msgpackr");
function decode(buffer) {
    return (0, msgpackr_1.unpack)(buffer);
}
function encode(value) {
    if (typeof value === 'object' && value !== null)
        Object.setPrototypeOf(value, null);
    return (0, msgpackr_1.pack)(value);
}
exports.type = 'application/msgpack';
exports.multipart = 'multipart/msgpack';
//# sourceMappingURL=msgpack.js.map