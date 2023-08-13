"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ioredis = exports.Connection = exports.Redis = void 0;
const randomstring_1 = require("randomstring");
exports.Redis = jest.fn(() => ({
    options: {
        host: (0, randomstring_1.generate)(),
        port: (0, randomstring_1.generate)()
    },
    connect: jest.fn(async () => undefined),
    disconnect: jest.fn(),
    get: jest.fn(async () => (0, randomstring_1.generate)()),
    getBuffer: jest.fn(async () => Buffer.from((0, randomstring_1.generate)())),
    set: jest.fn(async () => undefined),
    on: jest.fn()
}));
exports.Connection = jest.fn(() => ({
    redises: [new exports.Redis()],
    link: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn()
}));
exports.ioredis = { Redis: exports.Redis };
//# sourceMappingURL=Connection.fixtures.js.map