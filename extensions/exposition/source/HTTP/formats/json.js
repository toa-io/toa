"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipart = exports.type = void 0;
exports.decode = decode;
exports.encode = encode;
exports.type = 'application/json';
exports.multipart = 'multipart/json';
function decode(buffer, charset = 'utf-8') {
    const text = buffer.toString(charset);
    return JSON.parse(text);
}
function encode(value) {
    const text = JSON.stringify(value);
    return Buffer.from(text);
}
//# sourceMappingURL=json.js.map