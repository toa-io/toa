"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scanner = void 0;
const node_stream_1 = require("node:stream");
const node_crypto_1 = require("node:crypto");
const negotiator_1 = __importDefault(require("negotiator"));
class Scanner extends node_stream_1.PassThrough {
    size = 0;
    type = 'application/octet-stream';
    error;
    hash = (0, node_crypto_1.createHash)('md5');
    claim;
    accept;
    limit;
    position = 0;
    completed = false;
    chunks = [];
    constructor(control) {
        super();
        this.claim = control?.claim;
        this.accept = control?.accept;
        this.limit = control?.limit;
    }
    digest() {
        return this.hash.digest('hex');
    }
    _transform(buffer, encoding, callback) {
        super._transform(buffer, encoding, callback);
        this.process(buffer);
    }
    process = (buffer) => {
        this.size += buffer.length;
        this.hash.update(buffer);
        if (this.completed)
            return;
        if (this.position + buffer.length > HEADER_SIZE)
            buffer = buffer.subarray(0, HEADER_SIZE - this.position);
        this.chunks.push(buffer);
        this.position += buffer.length;
        if (this.position === HEADER_SIZE)
            this.complete();
        if (this.limit !== undefined && this.size > this.limit)
            this.interrupt(ERR_LIMIT_EXCEEDED);
    };
    complete() {
        const header = Buffer.concat(this.chunks).toString('hex');
        const signature = SIGNATURES
            .find(({ off, hex, expression }) => {
            const sig = header.slice(off, off + hex.length);
            return expression === undefined
                ? sig === hex
                : expression.test(sig);
        });
        const type = signature?.type ?? this.claim;
        if (type !== undefined) {
            this.match(type);
            this.type = type;
        }
        this.verify(signature);
        this.completed = true;
    }
    verify(signature) {
        if (this.claim === undefined || this.claim === 'application/octet-stream')
            return;
        const mismatch = signature === undefined
            ? KNOWN_TYPES.has(this.claim)
            : this.claim !== signature.type;
        if (mismatch)
            this.interrupt(ERR_TYPE_MISMATCH);
    }
    match(type) {
        if (this.accept === undefined)
            return;
        const unacceptable = this.negotiate(this.accept, [type]) === null;
        if (unacceptable)
            this.interrupt(ERR_NOT_ACCEPTABLE);
    }
    negotiate(accept, type) {
        return new negotiator_1.default({ headers: { accept } }).mediaType(type) ?? null;
    }
    interrupt(error) {
        this.completed = true;
        this.error = error;
        this.destroy(error);
    }
}
exports.Scanner = Scanner;
// https://en.wikipedia.org/wiki/List_of_file_signatures
const SIGNATURES = [
    { hex: 'ff d8 ff e0', off: 0, type: 'image/jpeg' },
    { hex: 'ff d8 ff e1', off: 0, type: 'image/jpeg' },
    { hex: 'ff d8 ff e2', off: 0, type: 'image/jpeg' },
    { hex: 'ff d8 ff ee', off: 0, type: 'image/jpeg' },
    { hex: 'ff d8 ff db', off: 0, type: 'image/jpeg' },
    { hex: '89 50 4e 47', off: 0, type: 'image/png' },
    { hex: '47 49 46 38', off: 0, type: 'image/gif' },
    { hex: '52 49 46 46 ?? ?? ?? ?? 57 45 42 50', off: 0, type: 'image/webp' },
    { hex: '4a 58 4c 20 0d 0a 87 0a', off: 8, type: 'image/jxl' },
    { hex: '66 74 79 70 68 65 69 63', off: 8, type: 'image/heic' },
    { hex: '66 74 79 70 61 76 69 66', off: 8, type: 'image/avif' },
    { hex: '52 49 46 46 ?? ?? ?? ?? 41 56 49 20', off: 0, type: 'video/avi' },
    { hex: '52 49 46 46 ?? ?? ?? ?? 57 41 56 45', off: 0, type: 'audio/wav' }
    /*
    When adding a new signature, include a copyright-free sample file in the `.tests` directory
    and update the `signatures` test group in `Storage.test.ts`.
     */
].map((signature) => {
    signature.hex = signature.hex.replaceAll(' ', '');
    if (signature.hex.includes('??')) {
        const expression = signature.hex.replaceAll(/(?<wildcards>\?{1,24})/g, (_, wildcards) => `[0-9a-f]{${wildcards.length}}`);
        signature.expression = new RegExp(expression, 'i');
    }
    return signature;
});
const HEADER_SIZE = SIGNATURES
    .reduce((max, { off, hex }) => Math.max(max, off + hex.length), 0) / 2;
const KNOWN_TYPES = new Set(SIGNATURES.map(({ type }) => type));
const ERR_TYPE_MISMATCH = new (class TypeMismatchError extends Error {
    code = 'TYPE_MISMATCH';
})();
const ERR_NOT_ACCEPTABLE = new (class NotAcceptableError extends Error {
    code = 'NOT_ACCEPTABLE';
})();
const ERR_LIMIT_EXCEEDED = new (class LimitExceededError extends Error {
    code = 'LIMIT_EXCEEDED';
})();
//# sourceMappingURL=Scanner.js.map