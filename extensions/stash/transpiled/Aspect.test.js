"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redlock_temp_fix_1 = __importDefault(require("redlock-temp-fix"));
const msgpackr_1 = require("msgpackr");
const randomstring_1 = require("randomstring");
const Aspect_1 = require("./Aspect");
const mock = __importStar(require("./Connection.fixtures"));
jest.mock('redlock-temp-fix');
let aspect;
let connection;
let redises;
let redis;
let redlock;
const key = (0, randomstring_1.generate)();
beforeEach(async () => {
    jest.clearAllMocks();
    connection = new mock.Connection();
    redises = connection.redises;
    redis = redises[0];
    aspect = new Aspect_1.Aspect(connection);
    await aspect.connect();
    redlock = redlock_temp_fix_1.default.mock
        .instances[0];
});
it('should depend on Connection', async () => {
    expect(connection.link)
        .toHaveBeenCalledWith(aspect);
});
it('should set', async () => {
    const value = (0, randomstring_1.generate)();
    await aspect.invoke('set', key, value);
    expect(redis.set)
        .toHaveBeenCalledWith(key, value);
});
it('should get', async () => {
    const value = await aspect.invoke('get', key);
    expect(redis.get)
        .toHaveBeenCalledWith(key);
    expect(value)
        .toStrictEqual(await redis.get.mock.results[0].value);
});
describe('buffers', () => {
    it.each([
        ['object', { [(0, randomstring_1.generate)()]: (0, randomstring_1.generate)() }],
        ['array', [(0, randomstring_1.generate)(), (0, randomstring_1.generate)()]]
    ])('should encode %s', async (_, value) => {
        await aspect.invoke('store', key, value);
        const buffer = (0, msgpackr_1.encode)(value);
        expect(redis.set)
            .toHaveBeenCalledWith(key, buffer);
    });
    it('should pass arguments', async () => {
        const value = [1, 2];
        const buffer = (0, msgpackr_1.encode)(value);
        await aspect.invoke('store', key, value, 'EX', 1000);
        expect(redis.set)
            .toHaveBeenCalledWith(key, buffer, 'EX', 1000);
    });
    it.each([
        ['object', { [(0, randomstring_1.generate)()]: (0, randomstring_1.generate)() }],
        ['array', [(0, randomstring_1.generate)(), (0, randomstring_1.generate)()]]
    ])('should decode %s', async (_, value) => {
        const buffer = (0, msgpackr_1.encode)(value);
        redis.getBuffer.mockImplementationOnce(async () => buffer);
        const output = await aspect.invoke('fetch', key);
        expect(redis.getBuffer)
            .toHaveBeenCalledWith(key);
        expect(output)
            .toStrictEqual(value);
    });
});
it('should create DLM', async () => {
    expect(redlock_temp_fix_1.default)
        .toHaveBeenCalledWith([redis], { retryCount: -1 });
});
it('should acquire lock', async () => {
    const keys = [(0, randomstring_1.generate)(), (0, randomstring_1.generate)()];
    const callback = jest.fn();
    await aspect.invoke('lock', keys, callback);
    expect(redlock.using)
        .toHaveBeenCalledWith(keys, 5000, callback);
});
it('should return result', async () => {
    const keys = [(0, randomstring_1.generate)(), (0, randomstring_1.generate)()];
    const callback = jest.fn();
    redlock.using.mockImplementationOnce(async () => (0, randomstring_1.generate)());
    const result = await aspect.invoke('lock', keys, callback);
    expect(result)
        .toStrictEqual(await redlock.using.mock.results[0].value);
});
it('should handle non-array key', async () => {
    const key = (0, randomstring_1.generate)();
    const callback = jest.fn();
    await aspect.invoke('lock', key, callback);
    expect(redlock.using)
        .toHaveBeenCalledWith([key], 5000, callback);
});
//# sourceMappingURL=Aspect.test.js.map