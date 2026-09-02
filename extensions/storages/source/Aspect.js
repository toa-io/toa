"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Aspect = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const core_1 = require("@toa.io/core");
class Aspect extends core_1.Connector {
    name = 'storages';
    storages;
    constructor(storages) {
        super();
        this.storages = storages;
    }
    invoke(name, method, ...args) {
        const storage = this.storages[name];
        node_assert_1.default.ok(storage !== undefined, `Storage '${name}' is not defined`);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return storage[method](...args);
    }
}
exports.Aspect = Aspect;
//# sourceMappingURL=Aspect.js.map