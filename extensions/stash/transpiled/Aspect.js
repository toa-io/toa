"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Aspect = void 0;
const redlock_temp_fix_1 = __importDefault(require("redlock-temp-fix"));
const msgpackr_1 = require("msgpackr");
const core_1 = require("@toa.io/core");
class Aspect extends core_1.Connector {
    name = 'stash';
    connection;
    redis = null;
    redlock = null;
    constructor(connection) {
        super();
        this.connection = connection;
        this.depends(connection);
    }
    async invoke(method, ...args) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (typeof this.redis[method] === 'function')
            return this.redis[method](...args);
        if (method === 'store')
            await this.store(args[0], args[1], ...args.slice(2));
        if (method === 'fetch')
            return await this.fetch(args[0]);
        if (method === 'lock')
            return await this.lock(args[0], args[1]);
    }
    async open() {
        this.redis = this.connection.redises[0];
        this.redlock = new redlock_temp_fix_1.default(this.connection.redises, { retryCount: -1 });
    }
    async store(key, value, ...args) {
        const buffer = (0, msgpackr_1.encode)(value);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        await this.redis.set(key, buffer, ...args);
    }
    async fetch(key) {
        if (this.redis === null)
            return null;
        const buffer = await this.redis.getBuffer(key);
        return buffer === null ? null : (0, msgpackr_1.decode)(buffer);
    }
    async lock(key, routine) {
        if (this.redlock === null)
            return null;
        if (typeof key === 'string')
            key = [key];
        return await this.redlock.using(key, 5000, routine);
    }
}
exports.Aspect = Aspect;
//# sourceMappingURL=Aspect.js.map