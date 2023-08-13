"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const randomstring_1 = require("randomstring");
const core_1 = require("@toa.io/core");
const Connection_1 = require("./Connection");
const Connection_fixtures_1 = require("./Connection.fixtures");
jest.mock('ioredis', () => ({
    Redis: jest.fn((nodes, options) => new Connection_fixtures_1.Redis(nodes, options))
}));
let connection;
let redises;
const urls = [uri(), uri(), uri()];
const locator = new core_1.Locator((0, randomstring_1.generate)(), (0, randomstring_1.generate)());
beforeAll(() => {
    process.env[`TOA_STASH_${locator.uppercase}`] = urls.join(' ');
});
afterAll(() => {
    process.env[`TOA_STASH_${locator.uppercase}`] = undefined;
});
beforeEach(() => {
    jest.clearAllMocks();
    connection = new Connection_1.Connection(locator);
});
it('should be instance of Connector', async () => {
    expect(connection)
        .toBeInstanceOf(core_1.Connector);
});
it('should disconnect', async () => {
    await connection.connect();
    await connection.disconnect();
    redises = Connection_fixtures_1.Redis.mock.results.map((result) => result.value);
    for (const redis of redises)
        expect(redis.disconnect).toHaveBeenCalled();
});
it('should expose cluster', async () => {
    await connection.connect();
    redises = Connection_fixtures_1.Redis.mock.results.map((result) => result.value);
    expect(connection.redises)
        .toStrictEqual(redises);
});
function uri() {
    return 'redis://host-' + (0, randomstring_1.generate)();
}
//# sourceMappingURL=Connection.test.js.map