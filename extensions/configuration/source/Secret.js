"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDACTED = exports.Secret = void 0;
const node_util_1 = require("node:util");
/** A configuration value that must not leak: a string only to whoever asks for it. */
class Secret {
    #value;
    constructor(value) {
        this.#value = value;
    }
    unwrap() {
        return this.#value;
    }
    toString() {
        return exports.REDACTED;
    }
    toJSON() {
        return exports.REDACTED;
    }
    [node_util_1.inspect.custom]() {
        return exports.REDACTED;
    }
}
exports.Secret = Secret;
exports.REDACTED = '<REDACTED>';
//# sourceMappingURL=Secret.js.map