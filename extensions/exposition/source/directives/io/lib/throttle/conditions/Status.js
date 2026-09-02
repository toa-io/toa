"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Status = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
class Status {
    status;
    constructor(status) {
        node_assert_1.default.ok(typeof status === 'number', 'Status must be a number');
        this.status = status;
    }
    match(input, output) {
        return output?.status === this.status;
    }
}
exports.Status = Status;
//# sourceMappingURL=Status.js.map