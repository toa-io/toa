"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipart = exports.type = void 0;
exports.decode = decode;
exports.encode = encode;
exports.type = 'text/plain';
exports.multipart = 'multipart/text';
function decode(buffer, charset = 'utf-8') {
    return buffer.toString(charset);
}
function encode(value) {
    return Buffer.from(value.toString());
}
//# sourceMappingURL=text.js.map